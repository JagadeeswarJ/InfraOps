import { Request, Response } from "express";
import { db } from "../config/db.config.js";
import { Ticket } from "../utils/types.js";
import { FieldValue } from "firebase-admin/firestore";
import { callGemini } from "../utils/gemini.util.js";
import {
    notifyTicketAssigned,
    notifyTicketStatusChanged
} from "../utils/notification.util.js";

const createTicket = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            title,
            description,
            images,
            imageUrl, // Legacy field for backward compatibility
            reportedBy,
            category,
            location,
            priority = 'auto',
            communityId,
            autoAssign = false
        } = req.body;

        // Handle both new 'images' field and legacy 'imageUrl' field
        const imageData = images || imageUrl || [];

        // Validate required fields
        if (!title || !description || !reportedBy || !category || !location || !communityId) {
            return res.status(400).json({
                error: "Missing required fields: title, description, reportedBy, category, location, communityId"
            });
        }

        // Validate user exists
        const userDoc = await db.collection('users').doc(reportedBy).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        // Validate community exists
        const communityDoc = await db.collection('communities').doc(communityId).get();
        if (!communityDoc.exists) {
            return res.status(404).json({
                error: "Community not found"
            });
        }

        // Create initial ticket data
        const ticketData: Ticket = {
            title,
            description,
            images: Array.isArray(imageData) ? imageData.filter(img => img !== null) : (imageData ? [imageData] : []),
            reportedBy,
            category,
            location,
            priority,
            status: 'open',
            communityId,
            createdAt: FieldValue.serverTimestamp() as any,
            updatedAt: FieldValue.serverTimestamp() as any
        };

        // Save ticket to get ID first
        const ticketRef = await db.collection('tickets').add(ticketData);
        const ticketId = ticketRef.id;

        try {
            // Process with AI for metadata, spam detection, and similar ticket detection
            const aiResult = await processTicketWithAI(ticketData, ticketId, communityId);

            // Handle spam detection
            if (aiResult.isSpam) {
                await ticketRef.update({
                    status: 'spam',
                    spamMetadata: {
                        confidence: aiResult.spamConfidence,
                        reason: aiResult.spamReason,
                        detectedAt: FieldValue.serverTimestamp()
                    },
                    updatedAt: FieldValue.serverTimestamp()
                });

                return res.status(200).json({
                    success: true,
                    message: "Ticket flagged as spam",
                    ticketId,
                    spam: {
                        detected: true,
                        confidence: aiResult.spamConfidence,
                        reason: aiResult.spamReason
                    }
                });
            }

            if (aiResult.shouldMergeWithExisting && aiResult.similarTicketId) {
                // Merge with existing similar ticket
                return await mergeWithSimilarTicket(
                    ticketId,
                    aiResult.similarTicketId,
                    ticketData,
                    res
                );
            } else {
                // Update ticket with AI metadata
                const finalPriority = aiResult.metadata.predictedUrgency === 'high' ? 'high' :
                    aiResult.metadata.predictedUrgency === 'low' ? 'low' : priority;

                await ticketRef.update({
                    aiMetadata: aiResult.metadata,
                    priority: finalPriority,
                    requiredTools: aiResult.requiredTools,
                    requiredMaterials: aiResult.requiredMaterials,
                    estimatedDuration: aiResult.estimatedDuration,
                    difficultyLevel: aiResult.difficultyLevel,
                    updatedAt: FieldValue.serverTimestamp()
                });

                // Get updated ticket data for auto-assignment
                const updatedTicketData: Ticket = {
                    ...ticketData,
                    priority: finalPriority,
                    aiMetadata: {
                        ...aiResult.metadata,
                        predictedUrgency: aiResult.metadata.predictedUrgency as 'low' | 'high'
                    }
                };

                let assignmentResult = null;

                // Auto-assign if requested
                if (autoAssign) {
                    try {
                        const bestTechnician = await findBestTechnician(updatedTicketData);
                        if (bestTechnician) {
                            await ticketRef.update({
                                assignedTo: bestTechnician.id,
                                status: 'assigned',
                                assignmentMetadata: {
                                    autoAssigned: true,
                                    assignedAt: FieldValue.serverTimestamp(),
                                    assignmentScore: bestTechnician.score,
                                    assignmentReason: bestTechnician.reason
                                },
                                updatedAt: FieldValue.serverTimestamp()
                            });

                            assignmentResult = {
                                assigned: true,
                                technician: {
                                    id: bestTechnician.id,
                                    name: bestTechnician.name,
                                    expertise: bestTechnician.expertise,
                                    score: bestTechnician.score,
                                    reason: bestTechnician.reason
                                }
                            };
                        } else {
                            assignmentResult = {
                                assigned: false,
                                reason: "No available technicians found"
                            };
                        }
                    } catch (assignError) {
                        console.error("Auto-assignment failed:", assignError);
                        assignmentResult = {
                            assigned: false,
                            reason: "Auto-assignment failed"
                        };
                    }
                }

                return res.status(201).json({
                    success: true,
                    message: "Ticket created successfully",
                    ticketId,
                    ticket: {
                        id: ticketId,
                        ...updatedTicketData,
                        ...(assignmentResult?.assigned && assignmentResult.technician && {
                            assignedTo: assignmentResult.technician.id,
                            status: 'assigned'
                        })
                    },
                    ...(assignmentResult && { assignment: assignmentResult }),
                    redirectUrl: `/ticket/${ticketId}`
                });
            }
        } catch (aiError) {
            console.error("AI processing failed:", aiError);
            // Continue without AI metadata if AI fails
            return res.status(201).json({
                success: true,
                message: "Ticket created successfully (AI processing failed)",
                ticketId,
                ticket: {
                    id: ticketId,
                    ...ticketData
                },
                redirectUrl: `/ticket/${ticketId}`
            });
        }

    } catch (error) {
        console.error("Create ticket error:", error);
        return res.status(500).json({
            error: "Internal server error while creating ticket"
        });
    }
};

const processTicketWithAI = async (ticketData: Ticket, ticketId: string, communityId: string) => {
    // Get similar tickets from the same community
    const similarTicketsQuery = await db.collection('tickets')
        .where('communityId', '==', communityId)
        .where('status', 'in', ['open', 'assigned', 'in_progress'])
        .limit(10)
        .get();

    const similarTickets = similarTicketsQuery.docs
        .map(doc => {
            const data = doc.data() as Ticket;
            return {
                id: doc.id,
                ...data
            };
        })
        .slice(0, 10);

    // Get recent tickets from same reporter for spam detection
    const recentReporterTickets = await db.collection('tickets')
        .where('reportedBy', '==', ticketData.reportedBy)
        .where('createdAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        .get();

    // Get available technicians for location-based assignment
    const techniciansQuery = await db.collection('users')
        .where('role', '==', 'technician')
        .where('communityId', '==', communityId)
        .get();

    const technicians = techniciansQuery.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            expertise: data.expertise || [],
            currentLocation: data.currentLocation || null
        };
    });

    // Prepare comprehensive AI prompt
    const aiPrompt = `
You are an advanced maintenance ticket analysis AI. Analyze the following ticket for:
1. Category prediction and urgency
2. Spam detection
3. Similar ticket detection
4. Best technician assignment based on skills and location

NEW TICKET:
Title: ${ticketData.title}
Description: ${ticketData.description}
Category: ${ticketData.category}
Location: ${ticketData.location}

SPAM DETECTION CONTEXT:
- Reporter has created ${recentReporterTickets.size} tickets in the last 24 hours
- Recent tickets from same reporter: ${recentReporterTickets.docs.slice(0, 3).map(doc => {
        const data = doc.data();
        return `"${data.title}" - ${data.description}`;
    }).join(', ')}

EXISTING SIMILAR TICKETS:
${similarTickets.map(ticket => `
ID: ${ticket.id}
Title: ${ticket.title}
Description: ${ticket.description}  
Category: ${ticket.category}
Location: ${ticket.location}
Status: ${ticket.status}
`).join('\n')}

AVAILABLE TECHNICIANS:
${technicians.map(tech => `
ID: ${tech.id}
Name: ${tech.name}
Expertise: ${tech.expertise.join(', ')}
Current Location: ${tech.currentLocation || 'Unknown'}
`).join('\n')}

ANALYSIS REQUIREMENTS:
1. Category from: plumbing, electrical, hvac, carpentry, painting, appliance, landscaping, maintenance, security, elevator, fire_safety, pest_control
2. Urgency: 'low' or 'high' based on safety/impact
3. Spam detection: Check for duplicate/nonsensical content, excessive reporting
4. Location proximity matching for technician assignment
5. Skill matching for technician assignment
6. Required tools and materials estimation

Respond with ONLY valid JSON:
{
  "predictedCategory": "category_name",
  "predictedUrgency": "low|high",
  "confidence": 0.95,
  "isSpam": true|false,
  "spamConfidence": 0.85,
  "spamReason": "explanation if spam detected",
  "similarTickets": ["ticket_id1", "ticket_id2"],
  "shouldMerge": true|false,
  "mergeWithTicketId": "ticket_id_or_null",
  "recommendedTechnician": {
    "id": "technician_id",
    "name": "technician_name",
    "skillMatch": 0.9,
    "locationMatch": 0.8,
    "reasoning": "why this technician"
  },
  "alternativeTechnicians": [
    {
      "id": "alt_tech_id",
      "skillMatch": 0.7,
      "locationMatch": 0.6
    }
  ],
  "requiredTools": [
    {
      "name": "Adjustable Wrench",
      "category": "hand_tool",
      "estimated_cost": "$15-25",
      "required": true,
      "alternatives": ["Pipe Wrench", "Channel Lock Pliers"]
    }
  ],
  "requiredMaterials": [
    {
      "name": "PVC Pipe",
      "quantity": "2",
      "unit": "feet",
      "estimated_cost": "$8-12",
      "required": true,
      "alternatives": ["Copper Pipe", "PEX Pipe"]
    }
  ],
  "estimatedDuration": "2-3 hours",
  "difficultyLevel": "medium",
  "reasoning": "Overall analysis explanation"
}`;

    try {
        const processId = `ai_process_${ticketId}_${Date.now()}`;
        console.log(`\n🤖 [${processId}] === TICKET AI PROCESSING START ===`);
        console.log(`[${processId}] Ticket ID: ${ticketId}`);
        console.log(`[${processId}] Community ID: ${communityId}`);
        console.log(`[${processId}] Has images: ${!!(ticketData.images && ticketData.images.length > 0)}`);

        if (ticketData.images && ticketData.images.length > 0) {
            console.log(`[${processId}] Images to analyze: ${ticketData.images.length} base64 images`);
        }

        console.log(`[${processId}] AI Prompt length: ${aiPrompt.length} characters`);
        console.log(`[${processId}] 📝 AI Prompt Content:`);
        console.log(`[${processId}] ${aiPrompt}`);

        console.log(`[${processId}] Calling Gemini AI...`);
        const aiStartTime = Date.now();

        const aiResponse = await callGemini({
            messages: [
                {
                    role: "user",
                    parts: [{ text: aiPrompt }]
                }
            ],
            imageBase64Array: ticketData.images && ticketData.images.length > 0 ? ticketData.images : undefined
        });

        const aiDuration = Date.now() - aiStartTime;
        console.log(`[${processId}] ✅ AI processing completed in ${aiDuration}ms`);
        console.log(`[${processId}] 🔮 Raw AI Response (${aiResponse.length} chars):`);
        console.log(`[${processId}] ${aiResponse}`);

        console.log(`[${processId}] Parsing AI response as JSON...`);
        let aiData;
        try {
            aiData = JSON.parse(aiResponse);
            console.log(`[${processId}] ✅ JSON parsing successful`);
            console.log(`[${processId}] 📊 Parsed AI Data:`, JSON.stringify(aiData, null, 2));
        } catch (parseError) {
            console.error(`[${processId}] ❌ JSON parsing failed:`, parseError);
            throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }

        console.log(`[${processId}] Building metadata object...`);
        const metadata = {
            predictedCategory: aiData.predictedCategory,
            predictedUrgency: aiData.predictedUrgency,
            similarPastTickets: aiData.similarTickets || [],
            processedAt: FieldValue.serverTimestamp() as any,
            confidence: aiData.confidence,
            recommendedTechnician: aiData.recommendedTechnician,
            alternativeTechnicians: aiData.alternativeTechnicians || []
        };

        const result = {
            metadata,
            isSpam: aiData.isSpam === true,
            spamConfidence: aiData.spamConfidence || 0,
            spamReason: aiData.spamReason || '',
            shouldMergeWithExisting: aiData.shouldMerge === true,
            similarTicketId: aiData.mergeWithTicketId,
            reasoning: aiData.reasoning,
            requiredTools: aiData.requiredTools || [],
            requiredMaterials: aiData.requiredMaterials || [],
            estimatedDuration: aiData.estimatedDuration,
            difficultyLevel: aiData.difficultyLevel
        };

        console.log(`[${processId}] 📋 Final AI Processing Result:`);
        console.log(`[${processId}]   - Predicted Category: ${result.metadata.predictedCategory}`);
        console.log(`[${processId}]   - Predicted Urgency: ${result.metadata.predictedUrgency}`);
        console.log(`[${processId}]   - Is Spam: ${result.isSpam} (confidence: ${result.spamConfidence})`);
        console.log(`[${processId}]   - Should Merge: ${result.shouldMergeWithExisting}`);
        console.log(`[${processId}]   - Similar Ticket ID: ${result.similarTicketId}`);
        console.log(`[${processId}]   - Required Tools: [${result.requiredTools.join(', ')}]`);
        console.log(`[${processId}]   - Required Materials: [${result.requiredMaterials.join(', ')}]`);
        console.log(`[${processId}]   - Estimated Duration: ${result.estimatedDuration}`);
        console.log(`[${processId}]   - Difficulty Level: ${result.difficultyLevel}`);
        console.log(`[${processId}]   - Reasoning: ${result.reasoning}`);
        console.log(`[${processId}] === TICKET AI PROCESSING SUCCESS ===\n`);

        return result;

    } catch (error) {
        console.error(`❌ [AI Processing Error for ticket ${ticketId}] ===`);
        console.error(`Ticket ID: ${ticketId}`);
        console.error(`Community ID: ${communityId}`);
        console.error(`Error:`, error);
        console.error(`Error details:`, {
            message: (error as Error).message,
            stack: (error as Error).stack,
            name: (error as Error).name
        });
        console.error(`=== AI PROCESSING ERROR END ===\n`);
        // Return default metadata if AI fails
        return {
            metadata: {
                predictedCategory: ticketData.category,
                predictedUrgency: 'low',
                similarPastTickets: [],
                processedAt: FieldValue.serverTimestamp() as any,
                confidence: 0
            },
            isSpam: false,
            spamConfidence: 0,
            spamReason: '',
            shouldMergeWithExisting: false,
            similarTicketId: null,
            reasoning: 'AI processing failed, using defaults',
            requiredTools: [],
            requiredMaterials: [],
            estimatedDuration: 'Unknown',
            difficultyLevel: 'medium'
        };
    }
};

const mergeWithSimilarTicket = async (
    newTicketId: string,
    existingTicketId: string,
    newTicketData: Ticket,
    res: Response
) => {
    try {
        // Get existing ticket
        const existingTicketDoc = await db.collection('tickets').doc(existingTicketId).get();
        if (!existingTicketDoc.exists) {
            throw new Error("Similar ticket not found");
        }

        const existingTicketData = existingTicketDoc.data() as Ticket;

        // Merge images
        const mergedImages = [
            ...(existingTicketData.images || []),
            ...(newTicketData.images || [])
        ];

        // Update existing ticket with merged data
        await db.collection('tickets').doc(existingTicketId).update({
            images: mergedImages,
            description: `${existingTicketData.description}\n\n--- Additional Report ---\n${newTicketData.description}`,
            history: [
                ...(existingTicketData.history || []),
                newTicketId
            ],
            updatedAt: FieldValue.serverTimestamp()
        });

        // Delete the new ticket since we're merging
        await db.collection('tickets').doc(newTicketId).delete();

        return res.status(200).json({
            success: true,
            message: "Ticket merged with existing similar issue",
            mergedWithTicketId: existingTicketId,
            redirectUrl: `/ticket/${existingTicketId}`
        });

    } catch (error) {
        console.error("Merge tickets error:", error);
        return res.status(500).json({
            error: "Failed to merge with similar ticket"
        });
    }
};

const getTicket = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: "Ticket ID is required"
            });
        }

        const ticketDoc = await db.collection('tickets').doc(id).get();

        if (!ticketDoc.exists) {
            return res.status(404).json({
                error: "Ticket not found"
            });
        }

        const ticketData = ticketDoc.data();

        return res.status(200).json({
            success: true,
            ticket: {
                id: ticketDoc.id,
                ...ticketData
            }
        });

    } catch (error) {
        console.error("Get ticket error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching ticket"
        });
    }
};

const getTickets = async (req: Request, res: Response): Promise<any> => {
    try {
        const { communityId, reportedBy, status, category } = req.query;

        // Start with base query without orderBy to avoid composite index requirement
        let query: any = db.collection('tickets');

        // Apply filters one by one
        if (communityId) {
            query = query.where('communityId', '==', communityId);
        }

        if (reportedBy) {
            query = query.where('reportedBy', '==', reportedBy);
        }

        if (status) {
            query = query.where('status', '==', status);
        }

        if (category) {
            query = query.where('category', '==', category);
        }

        const ticketsSnapshot = await query.get();

        // Get all tickets and sort in memory by createdAt desc
        const tickets = ticketsSnapshot.docs
            .map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }))
            .sort((a: any, b: any) => {
                const aCreatedAt = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
                const bCreatedAt = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
                return bCreatedAt.getTime() - aCreatedAt.getTime();
            });

        return res.status(200).json({
            success: true,
            tickets,
            total: tickets.length
        });

    } catch (error) {
        console.error("Get tickets error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching tickets"
        });
    }
};

const updateTicketStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { status, updatedBy } = req.body;

        if (!id || !status) {
            return res.status(400).json({
                error: "Ticket ID and status are required"
            });
        }

        const validStatuses = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: "Invalid status. Must be one of: " + validStatuses.join(', ')
            });
        }

        const ticketRef = db.collection('tickets').doc(id);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            return res.status(404).json({
                error: "Ticket not found"
            });
        }

        const ticketData = ticketDoc.data();
        const previousStatus = ticketData?.status;

        await ticketRef.update({
            status,
            updatedAt: FieldValue.serverTimestamp(),
            ...(updatedBy && { lastUpdatedBy: updatedBy })
        });

        // Send notifications for status change
        try {
            await notifyTicketStatusChanged(id, status, previousStatus, updatedBy);
        } catch (notificationError) {
            console.error("Failed to send status change notification:", notificationError);
        }

        return res.status(200).json({
            success: true,
            message: "Ticket status updated successfully"
        });

    } catch (error) {
        console.error("Update ticket status error:", error);
        return res.status(500).json({
            error: "Internal server error while updating ticket status"
        });
    }
};

const assignTicket = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { assignedTo, assignedBy } = req.body;

        if (!id || !assignedTo) {
            return res.status(400).json({
                error: "Ticket ID and assignedTo are required"
            });
        }

        // Verify technician exists
        const technicianDoc = await db.collection('users').doc(assignedTo).get();
        if (!technicianDoc.exists) {
            return res.status(404).json({
                error: "Technician not found"
            });
        }

        const technicianData = technicianDoc.data();
        if (technicianData?.role !== 'technician') {
            return res.status(400).json({
                error: "User is not a technician"
            });
        }

        const ticketRef = db.collection('tickets').doc(id);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            return res.status(404).json({
                error: "Ticket not found"
            });
        }

        await ticketRef.update({
            assignedTo,
            status: 'assigned',
            updatedAt: FieldValue.serverTimestamp(),
            ...(assignedBy && { assignedBy })
        });

        // Send assignment notification
        try {
            await notifyTicketAssigned(id, assignedTo, assignedBy);
        } catch (notificationError) {
            console.error("Failed to send assignment notification:", notificationError);
        }

        return res.status(200).json({
            success: true,
            message: "Ticket assigned successfully"
        });

    } catch (error) {
        console.error("Assign ticket error:", error);
        return res.status(500).json({
            error: "Internal server error while assigning ticket"
        });
    }
};

const updateTicket = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!id) {
            return res.status(400).json({
                error: "Ticket ID is required"
            });
        }

        const ticketRef = db.collection('tickets').doc(id);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            return res.status(404).json({
                error: "Ticket not found"
            });
        }

        // Remove fields that shouldn't be updated directly
        const { createdAt, id: ticketId, ...allowedUpdates } = updateData;

        await ticketRef.update({
            ...allowedUpdates,
            updatedAt: FieldValue.serverTimestamp()
        });

        return res.status(200).json({
            success: true,
            message: "Ticket updated successfully"
        });

    } catch (error) {
        console.error("Update ticket error:", error);
        return res.status(500).json({
            error: "Internal server error while updating ticket"
        });
    }
};

const deleteTicket = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: "Ticket ID is required"
            });
        }

        const ticketRef = db.collection('tickets').doc(id);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            return res.status(404).json({
                error: "Ticket not found"
            });
        }

        await ticketRef.delete();

        return res.status(200).json({
            success: true,
            message: "Ticket deleted successfully"
        });

    } catch (error) {
        console.error("Delete ticket error:", error);
        return res.status(500).json({
            error: "Internal server error while deleting ticket"
        });
    }
};

const getTicketsByTechnician = async (req: Request, res: Response): Promise<any> => {
    try {
        const { technicianId } = req.params;
        const { status } = req.query;

        if (!technicianId) {
            return res.status(400).json({
                error: "Technician ID is required"
            });
        }

        let query = db.collection('tickets')
            .where('assignedTo', '==', technicianId)
            .orderBy('createdAt', 'desc');

        if (status) {
            query = query.where('status', '==', status);
        }

        const ticketsSnapshot = await query.get();

        const tickets = ticketsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return res.status(200).json({
            success: true,
            tickets,
            total: tickets.length
        });

    } catch (error) {
        console.error("Get technician tickets error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching technician tickets"
        });
    }
};

const getTicketStats = async (req: Request, res: Response): Promise<any> => {
    try {
        const { communityId, technicianId } = req.query;

        // Create separate queries for each status since we can't reuse a filtered query
        const getStatusQuery = (status: string) => {
            let query = db.collection('tickets').where('status', '==', status);
            if (communityId) {
                query = query.where('communityId', '==', communityId);
            }
            if (technicianId) {
                query = query.where('assignedTo', '==', technicianId);
            }
            return query;
        };

        const [openTickets, assignedTickets, inProgressTickets, resolvedTickets, closedTickets] = await Promise.all([
            getStatusQuery('open').get(),
            getStatusQuery('assigned').get(),
            getStatusQuery('in_progress').get(),
            getStatusQuery('resolved').get(),
            getStatusQuery('closed').get()
        ]);

        const stats = {
            open: openTickets.size,
            assigned: assignedTickets.size,
            in_progress: inProgressTickets.size,
            resolved: resolvedTickets.size,
            closed: closedTickets.size,
            total: openTickets.size + assignedTickets.size + inProgressTickets.size + resolvedTickets.size + closedTickets.size
        };

        return res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        console.error("Get ticket stats error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching ticket statistics"
        });
    }
};

const autoAssignTicket = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { assignedBy } = req.body;

        if (!id) {
            return res.status(400).json({
                error: "Ticket ID is required"
            });
        }

        const ticketRef = db.collection('tickets').doc(id);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            return res.status(404).json({
                error: "Ticket not found"
            });
        }

        const ticketData = ticketDoc.data() as Ticket;

        // Find the best available technician
        const bestTechnician = await findBestTechnician(ticketData);

        if (!bestTechnician) {
            return res.status(404).json({
                error: "No available technicians found for this ticket category",
                category: ticketData.category,
                availableTechnicians: []
            });
        }

        // Assign the ticket
        await ticketRef.update({
            assignedTo: bestTechnician.id,
            status: 'assigned',
            updatedAt: FieldValue.serverTimestamp(),
            assignmentMetadata: {
                autoAssigned: true,
                assignedAt: FieldValue.serverTimestamp(),
                assignmentScore: bestTechnician.score,
                assignmentReason: bestTechnician.reason,
                ...(assignedBy && { assignedBy })
            }
        });

        return res.status(200).json({
            success: true,
            message: "Ticket auto-assigned successfully",
            assignedTo: {
                id: bestTechnician.id,
                name: bestTechnician.name,
                expertise: bestTechnician.expertise,
                score: bestTechnician.score,
                reason: bestTechnician.reason
            }
        });

    } catch (error) {
        console.error("Auto assign ticket error:", error);
        return res.status(500).json({
            error: "Internal server error while auto-assigning ticket"
        });
    }
};

const getAvailableTechnicians = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: "Ticket ID is required"
            });
        }

        const ticketDoc = await db.collection('tickets').doc(id).get();

        if (!ticketDoc.exists) {
            return res.status(404).json({
                error: "Ticket not found"
            });
        }

        const ticketData = ticketDoc.data() as Ticket;

        // Get all available technicians with their scores
        const availableTechnicians = await findAvailableTechnicians(ticketData);

        return res.status(200).json({
            success: true,
            ticket: {
                id,
                category: ticketData.category,
                priority: ticketData.priority,
                location: ticketData.location
            },
            availableTechnicians: availableTechnicians.map(tech => ({
                id: tech.id,
                name: tech.name,
                expertise: tech.expertise,
                workload: tech.workload,
                score: tech.score,
                reason: tech.reason,
                available: tech.available
            }))
        });

    } catch (error) {
        console.error("Get available technicians error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching available technicians"
        });
    }
};

interface TechnicianScore {
    id: string;
    name: string;
    expertise: string[];
    workload: number;
    score: number;
    reason: string;
    available: boolean;
}

const findBestTechnician = async (ticket: Ticket): Promise<TechnicianScore | null> => {
    const availableTechnicians = await findAvailableTechnicians(ticket);

    if (availableTechnicians.length === 0) {
        return null;
    }

    // Sort by score (highest first) and return the best match
    availableTechnicians.sort((a, b) => b.score - a.score);
    return availableTechnicians[0];
};

const findAvailableTechnicians = async (ticket: Ticket): Promise<TechnicianScore[]> => {
    try {
        // Get all technicians in the same community
        const techniciansQuery = await db.collection('users')
            .where('role', '==', 'technician')
            .where('communityId', '==', ticket.communityId)
            .get();

        const technicians = techniciansQuery.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Unknown',
                expertise: data.expertise || [],
                communityId: data.communityId,
                role: data.role,
                ...data
            };
        });

        // Get current workload for each technician (active tickets count)
        const technicianScores: TechnicianScore[] = [];

        for (const technician of technicians) {
            // Count active tickets assigned to this technician
            const activeTicketsQuery = await db.collection('tickets')
                .where('assignedTo', '==', technician.id)
                .where('status', 'in', ['assigned', 'in_progress'])
                .get();

            const workload = activeTicketsQuery.size;
            const expertise = technician.expertise || [];

            // Calculate assignment score
            const score = calculateAssignmentScore(ticket, technician, workload);
            const reason = getAssignmentReason(ticket, technician, workload, score);

            technicianScores.push({
                id: technician.id,
                name: technician.name,
                expertise,
                workload,
                score,
                reason,
                available: workload < 10 // Consider technician unavailable if they have 10+ active tickets
            });
        }

        // Filter only available technicians
        return technicianScores.filter(tech => tech.available);

    } catch (error) {
        console.error("Error finding available technicians:", error);
        return [];
    }
};

const calculateAssignmentScore = (ticket: Ticket, technician: any, workload: number): number => {
    let score = 0;
    const expertise = technician.expertise || [];

    // Primary skill match (highest weight)
    if (expertise.includes(ticket.category)) {
        score += 100;
    }

    // Related skill matches (medium weight)
    const relatedSkills = getRelatedSkills(ticket.category);
    const relatedMatches = expertise.filter((skill: string) => relatedSkills.includes(skill));
    score += relatedMatches.length * 30;

    // Workload penalty (lower workload = higher score)
    score -= workload * 5;

    // Priority bonus
    if (ticket.priority === 'high') {
        score += 20;
    }

    // Ensure score is not negative
    return Math.max(score, 0);
};

const getRelatedSkills = (category: string): string[] => {
    const skillRelations: { [key: string]: string[] } = {
        'plumbing': ['maintenance', 'appliance'],
        'electrical': ['maintenance', 'appliance', 'fire_safety'],
        'hvac': ['maintenance', 'electrical'],
        'carpentry': ['maintenance', 'painting'],
        'painting': ['carpentry', 'maintenance'],
        'appliance': ['electrical', 'plumbing', 'maintenance'],
        'landscaping': ['maintenance'],
        'maintenance': ['plumbing', 'electrical', 'hvac', 'carpentry', 'painting', 'appliance'],
        'security': ['electrical', 'maintenance'],
        'elevator': ['electrical', 'maintenance'],
        'fire_safety': ['electrical', 'maintenance'],
        'pest_control': ['maintenance']
    };

    return skillRelations[category] || [];
};

const getAssignmentReason = (ticket: Ticket, technician: any, workload: number, score: number): string => {
    const expertise = technician.expertise || [];

    if (expertise.includes(ticket.category)) {
        return `Primary expertise in ${ticket.category} (workload: ${workload})`;
    }

    const relatedSkills = getRelatedSkills(ticket.category);
    const relatedMatches = expertise.filter((skill: string) => relatedSkills.includes(skill));

    if (relatedMatches.length > 0) {
        return `Related expertise: ${relatedMatches.join(', ')} (workload: ${workload})`;
    }

    if (workload === 0) {
        return `Available technician with light workload`;
    }

    return `Available technician (workload: ${workload})`;
};

const getCurrentAssignedTickets = async (req: Request, res: Response): Promise<any> => {
    try {
        const { technicianId } = req.params;

        if (!technicianId) {
            return res.status(400).json({
                error: "Technician ID is required"
            });
        }

        // Get only currently active tickets (assigned or in_progress)
        const currentTicketsQuery = await db.collection('tickets')
            .where('assignedTo', '==', technicianId)
            .where('status', 'in', ['assigned', 'in_progress'])
            .orderBy('priority', 'desc')
            .orderBy('createdAt', 'asc')
            .get();

        const tickets = currentTicketsQuery.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timeAssigned: data.assignmentMetadata?.assignedAt || data.updatedAt,
                isOverdue: isTicketOverdue(data),
                estimatedDuration: data.estimatedDuration || getEstimatedDuration(data.category, data.priority),
                toolsAndMaterials: {
                    tools: data.requiredTools || [],
                    materials: data.requiredMaterials || [],
                    totalEstimatedCost: calculateTotalCost(data.requiredTools, data.requiredMaterials)
                }
            };
        });

        // Group by priority for better organization
        const groupedTickets = {
            high: tickets.filter((t: any) => t.priority === 'high'),
            medium: tickets.filter((t: any) => t.priority === 'medium'),
            low: tickets.filter((t: any) => t.priority === 'low')
        };

        return res.status(200).json({
            success: true,
            technicianId,
            currentTickets: tickets,
            groupedByPriority: groupedTickets,
            summary: {
                total: tickets.length,
                assigned: tickets.filter((t: any) => t.status === 'assigned').length,
                inProgress: tickets.filter((t: any) => t.status === 'in_progress').length,
                overdue: tickets.filter((t: any) => t.isOverdue).length,
                highPriority: groupedTickets.high.length
            }
        });

    } catch (error) {
        console.error("Get current assigned tickets error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching current assigned tickets"
        });
    }
};

const getTechnicianDashboard = async (req: Request, res: Response): Promise<any> => {
    try {
        const { technicianId } = req.params;

        if (!technicianId) {
            return res.status(400).json({
                error: "Technician ID is required"
            });
        }

        // Get technician info
        const technicianDoc = await db.collection('users').doc(technicianId).get();
        if (!technicianDoc.exists) {
            return res.status(404).json({
                error: "Technician not found"
            });
        }

        const technicianData = technicianDoc.data();

        // Get current tickets
        const currentTicketsQuery = await db.collection('tickets')
            .where('assignedTo', '==', technicianId)
            .where('status', 'in', ['assigned', 'in_progress'])
            .get();

        // Get completed tickets from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentCompletedQuery = await db.collection('tickets')
            .where('assignedTo', '==', technicianId)
            .where('status', 'in', ['resolved', 'closed'])
            .where('updatedAt', '>=', thirtyDaysAgo)
            .get();

        const currentTickets = currentTicketsQuery.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                isOverdue: isTicketOverdue(data)
            };
        });

        const recentCompleted = recentCompletedQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Calculate performance metrics
        const overdueCount = currentTickets.filter(t => t.isOverdue).length;
        const avgCompletionTime = calculateAvgCompletionTime(recentCompleted);

        return res.status(200).json({
            success: true,
            technician: {
                id: technicianId,
                name: technicianData?.name,
                expertise: technicianData?.expertise || [],
                communityId: technicianData?.communityId
            },
            dashboard: {
                currentWorkload: {
                    total: currentTickets.length,
                    assigned: currentTickets.filter((t: any) => t.status === 'assigned').length,
                    inProgress: currentTickets.filter((t: any) => t.status === 'in_progress').length,
                    overdue: overdueCount
                },
                recentPerformance: {
                    completedLast30Days: recentCompleted.length,
                    averageCompletionTime: avgCompletionTime,
                    onTimeCompletionRate: calculateOnTimeRate(recentCompleted)
                },
                currentTickets: currentTickets.slice(0, 5), // Top 5 for dashboard
                upcomingDeadlines: currentTickets
                    .filter((t: any) => getTicketDeadline(t))
                    .sort((a: any, b: any) => {
                        const deadlineA = getTicketDeadline(a);
                        const deadlineB = getTicketDeadline(b);
                        return (deadlineA?.getTime() || 0) - (deadlineB?.getTime() || 0);
                    })
                    .slice(0, 3)
            }
        });

    } catch (error) {
        console.error("Get technician dashboard error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching technician dashboard"
        });
    }
};

// Helper functions
const isTicketOverdue = (ticketData: any): boolean => {
    if (!ticketData.createdAt) return false;

    const createdAt = ticketData.createdAt?.toDate ? ticketData.createdAt.toDate() : (ticketData.createdAt ? new Date(ticketData.createdAt) : new Date());
    const now = new Date();
    const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Consider overdue based on priority
    const overdueThresholds = {
        high: 4,    // 4 hours
        medium: 24, // 24 hours  
        low: 72     // 72 hours
    };

    const threshold = overdueThresholds[ticketData.priority as keyof typeof overdueThresholds] || 24;
    return hoursSinceCreated > threshold;
};

const getEstimatedDuration = (category: string, priority: string): string => {
    const baseDurations: { [key: string]: number } = {
        plumbing: 2,
        electrical: 3,
        hvac: 4,
        carpentry: 6,
        painting: 4,
        appliance: 2,
        landscaping: 3,
        maintenance: 2,
        security: 1,
        elevator: 4,
        fire_safety: 1,
        pest_control: 3
    };

    const baseDuration = baseDurations[category] || 2;
    const priorityMultiplier = priority === 'high' ? 0.8 : priority === 'low' ? 1.2 : 1;

    const estimatedHours = Math.round(baseDuration * priorityMultiplier);
    return `${estimatedHours} hours`;
};

const getTicketDeadline = (ticketData: any): Date | null => {
    if (!ticketData.createdAt) return null;

    const createdAt = ticketData.createdAt?.toDate ? ticketData.createdAt.toDate() : (ticketData.createdAt ? new Date(ticketData.createdAt) : new Date());
    const deadline = new Date(createdAt);

    const deadlineHours = {
        high: 4,
        medium: 24,
        low: 72
    };

    const hours = deadlineHours[ticketData.priority as keyof typeof deadlineHours] || 24;
    deadline.setHours(deadline.getHours() + hours);

    return deadline;
};

const calculateAvgCompletionTime = (completedTickets: any[]): string => {
    if (completedTickets.length === 0) return 'N/A';

    const totalHours = completedTickets.reduce((sum, ticket) => {
        if (!ticket.createdAt || !ticket.updatedAt) return sum;

        const created = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : (ticket.createdAt ? new Date(ticket.createdAt) : new Date());
        const completed = ticket.updatedAt?.toDate ? ticket.updatedAt.toDate() : (ticket.updatedAt ? new Date(ticket.updatedAt) : new Date());

        const hours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + hours;
    }, 0);

    const avgHours = Math.round(totalHours / completedTickets.length);
    return `${avgHours} hours`;
};

const calculateOnTimeRate = (completedTickets: any[]): number => {
    if (completedTickets.length === 0) return 0;

    const onTimeTickets = completedTickets.filter(ticket => {
        const deadline = getTicketDeadline(ticket);
        if (!deadline || !ticket.updatedAt) return false;

        const completed = ticket.updatedAt?.toDate ? ticket.updatedAt.toDate() : (ticket.updatedAt ? new Date(ticket.updatedAt) : new Date());
        return completed <= deadline;
    });

    return Math.round((onTimeTickets.length / completedTickets.length) * 100);
};

const calculateTotalCost = (tools: any[] = [], materials: any[] = []): string => {
    let totalMin = 0;
    let totalMax = 0;

    [...tools, ...materials].forEach(item => {
        if (item.estimated_cost) {
            const cost = item.estimated_cost.replace(/[$,]/g, '');
            const match = cost.match(/(\d+(?:\.\d+)?)-?(\d+(?:\.\d+)?)?/);
            if (match) {
                const min = parseFloat(match[1]);
                const max = match[2] ? parseFloat(match[2]) : min;
                totalMin += min;
                totalMax += max;
            }
        }
    });

    if (totalMin === 0 && totalMax === 0) return 'N/A';
    if (totalMin === totalMax) return `$${totalMin}`;
    return `$${totalMin}-${totalMax}`;
};

const getSpamTickets = async (req: Request, res: Response): Promise<any> => {
    try {
        const { communityId, limit = 50 } = req.query;

        let query = db.collection('tickets').where('status', '==', 'spam');

        if (communityId) {
            query = query.where('communityId', '==', communityId);
        }

        const spamTicketsQuery = await query
            .orderBy('createdAt', 'desc')
            .limit(Number(limit))
            .get();

        const spamTickets = spamTicketsQuery.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timeSinceCreated: new Date().getTime() - (data.createdAt?.toDate ? data.createdAt.toDate().getTime() : 0)
            };
        });

        return res.status(200).json({
            success: true,
            spamTickets,
            total: spamTickets.length,
            summary: {
                highConfidence: spamTickets.filter((t: any) => t.spamMetadata?.confidence > 0.8).length,
                mediumConfidence: spamTickets.filter((t: any) => t.spamMetadata?.confidence > 0.5 && t.spamMetadata?.confidence <= 0.8).length,
                lowConfidence: spamTickets.filter((t: any) => t.spamMetadata?.confidence <= 0.5).length
            }
        });

    } catch (error) {
        console.error("Get spam tickets error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching spam tickets"
        });
    }
};

const markTicketAsSpam = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { reason, markedBy } = req.body;

        if (!id) {
            return res.status(400).json({
                error: "Ticket ID is required"
            });
        }

        const ticketRef = db.collection('tickets').doc(id);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            return res.status(404).json({
                error: "Ticket not found"
            });
        }

        await ticketRef.update({
            status: 'spam',
            spamMetadata: {
                confidence: 1.0,
                reason: reason || 'Manually marked as spam',
                detectedAt: FieldValue.serverTimestamp(),
                markedBy: markedBy || 'system'
            },
            updatedAt: FieldValue.serverTimestamp()
        });

        return res.status(200).json({
            success: true,
            message: "Ticket marked as spam successfully"
        });

    } catch (error) {
        console.error("Mark ticket as spam error:", error);
        return res.status(500).json({
            error: "Internal server error while marking ticket as spam"
        });
    }
};

const unmarkTicketAsSpam = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { newStatus = 'open', unmarkedBy } = req.body;

        if (!id) {
            return res.status(400).json({
                error: "Ticket ID is required"
            });
        }

        const ticketRef = db.collection('tickets').doc(id);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            return res.status(404).json({
                error: "Ticket not found"
            });
        }

        await ticketRef.update({
            status: newStatus,
            spamMetadata: {
                ...ticketDoc.data()?.spamMetadata,
                unmarkedAt: FieldValue.serverTimestamp(),
                unmarkedBy: unmarkedBy || 'system'
            },
            updatedAt: FieldValue.serverTimestamp()
        });

        return res.status(200).json({
            success: true,
            message: "Spam flag removed successfully"
        });

    } catch (error) {
        console.error("Unmark spam error:", error);
        return res.status(500).json({
            error: "Internal server error while removing spam flag"
        });
    }
};

export {
    createTicket,
    getTicket,
    getTickets,
    updateTicketStatus,
    assignTicket,
    autoAssignTicket,
    getAvailableTechnicians,
    updateTicket,
    deleteTicket,
    getTicketsByTechnician,
    getCurrentAssignedTickets,
    getTechnicianDashboard,
    getTicketStats,
    getSpamTickets,
    markTicketAsSpam,
    unmarkTicketAsSpam
};