import { Request, Response } from "express";
import { callGemini } from "../utils/gemini.util.js";
import { db } from "../config/db.config.js";

const testGemini = async (req: Request, res: Response): Promise<any> => {
    try {
        const { prompt, imageBase64, mimeType } = req.body;

        // Validate required fields
        if (!prompt) {
            return res.status(400).json({
                error: "Missing required field: prompt"
            });
        }

        // Prepare messages array
        const messages = [
            {
                role: "user" as const,
                parts: [{ text: prompt }]
            }
        ];

        // Call Gemini
        const response = await callGemini({
            messages,
            imageBase64,
            mimeType
        });
        // Parse Gemini's JSON response and log it
        let parsedResponse;
        try {
            parsedResponse = typeof response === "string" ? JSON.parse(response) : response;
        } catch (parseError) {
            console.error("Failed to parse Gemini response as JSON:", parseError);
            parsedResponse = response;
        }
        console.log("Gemini response:", parsedResponse);
        return res.status(200).json({
            success: true,
            prompt,
            response
        });

    } catch (error) {
        console.error("Gemini test error:", error);
        return res.status(500).json({
            error: "Internal server error during Gemini test",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

const analyzeTicketImage = async (req: Request, res: Response): Promise<any> => {
    try {
        const { imageBase64, mimeType = "image/jpeg", description } = req.body;

        if (!imageBase64) {
            return res.status(400).json({
                error: "Missing required field: imageBase64"
            });
        }

        const prompt = `
Analyze this maintenance-related image and provide detailed information in JSON format.

${description ? `Context: ${description}` : ''}

Please identify:
1. The type of issue (plumbing, electrical, HVAC, etc.)
2. Severity level (low, medium, high)
3. Visible damage or problems
4. Suggested category
5. Estimated urgency
6. Safety concerns if any

Respond with ONLY valid JSON:
{
  "category": "category_name",
  "severity": "low|medium|high",
  "description": "detailed description of what you see",
  "issues": ["list", "of", "identified", "issues"],
  "urgency": "low|high",
  "safetyConcerns": ["any", "safety", "issues"],
  "recommendations": ["immediate", "actions", "needed"]
}`;

        const response = await callGemini({
            messages: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
            imageBase64,
            mimeType
        });

        let analysis;
        try {
            analysis = JSON.parse(response);
        } catch (parseError) {
            analysis = { rawResponse: response };
        }

        return res.status(200).json({
            success: true,
            analysis,
            rawResponse: response
        });

    } catch (error) {
        console.error("Image analysis error:", error);
        return res.status(500).json({
            error: "Internal server error during image analysis",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

const suggestSolution = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title, description, category, imageAnalysis } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                error: "Missing required fields: title, description"
            });
        }

        const prompt = `
As a maintenance expert, provide solution suggestions for this issue:

Title: ${title}
Description: ${description}
Category: ${category || 'Unknown'}
${imageAnalysis ? `Image Analysis: ${JSON.stringify(imageAnalysis)}` : ''}

Provide a comprehensive solution plan in JSON format:
{
  "solutions": [
    {
      "title": "Solution name",
      "description": "Detailed steps",
      "difficulty": "easy|medium|hard",
      "estimatedTime": "time estimate",
      "tools": ["required", "tools"],
      "materials": ["required", "materials"],
      "cost": "estimated cost range",
      "priority": "high|medium|low"
    }
  ],
  "preventiveMeasures": ["prevention", "tips"],
  "warningsSafety": ["safety", "warnings"],
  "recommendedExpertise": "DIY|Professional|Emergency"
}`;

        const response = await callGemini({
            messages: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ]
        });

        let suggestions;
        try {
            suggestions = JSON.parse(response);
        } catch (parseError) {
            suggestions = { rawResponse: response };
        }

        return res.status(200).json({
            success: true,
            suggestions,
            rawResponse: response
        });

    } catch (error) {
        console.error("Solution suggestion error:", error);
        return res.status(500).json({
            error: "Internal server error during solution suggestion",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

const categorizeTicket = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                error: "Missing required fields: title, description"
            });
        }

        const prompt = `
Categorize this maintenance ticket based on the title and description:

Title: ${title}
Description: ${description}

Available categories: plumbing, electrical, hvac, carpentry, painting, appliance, landscaping, maintenance, security, elevator, fire_safety, pest_control

Respond with ONLY valid JSON:
{
  "category": "predicted_category",
  "confidence": 0.95,
  "reasoning": "brief explanation",
  "urgency": "low|high",
  "alternativeCategories": ["other", "possible", "categories"]
}`;

        const response = await callGemini({
            messages: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ]
        });

        let categorization;
        try {
            categorization = JSON.parse(response);
        } catch (parseError) {
            categorization = { rawResponse: response };
        }

        return res.status(200).json({
            success: true,
            categorization,
            rawResponse: response
        });

    } catch (error) {
        console.error("Ticket categorization error:", error);
        return res.status(500).json({
            error: "Internal server error during ticket categorization",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

const findSimilarTickets = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title, description, communityId } = req.body;

        if (!title || !description || !communityId) {
            return res.status(400).json({
                error: "Missing required fields: title, description, communityId"
            });
        }

        // Get recent tickets from the same community
        const recentTicketsQuery = await db.collection('tickets')
            .where('communityId', '==', communityId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const recentTickets = recentTicketsQuery.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                category: data.category,
                status: data.status
            };
        });

        const prompt = `
Find similar tickets to this new one:

NEW TICKET:
Title: ${title}
Description: ${description}

EXISTING TICKETS:
${recentTickets.map(ticket => `
ID: ${ticket.id}
Title: ${ticket.title}
Description: ${ticket.description}
Category: ${ticket.category}
Status: ${ticket.status}
`).join('\n')}

Respond with ONLY valid JSON:
{
  "similarTickets": [
    {
      "id": "ticket_id",
      "similarity": 0.95,
      "reasoning": "why similar"
    }
  ],
  "hasDuplicates": true|false,
  "duplicateIds": ["ticket_ids"],
  "recommendations": "merge|keep_separate"
}`;

        const response = await callGemini({
            messages: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ]
        });

        let similarityAnalysis;
        try {
            similarityAnalysis = JSON.parse(response);
        } catch (parseError) {
            similarityAnalysis = { rawResponse: response };
        }

        return res.status(200).json({
            success: true,
            similarityAnalysis,
            rawResponse: response
        });

    } catch (error) {
        console.error("Similar tickets error:", error);
        return res.status(500).json({
            error: "Internal server error during similar tickets search",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

const getAssignmentRecommendation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { ticketId, availableTechnicians } = req.body;

        if (!ticketId || !availableTechnicians || !Array.isArray(availableTechnicians)) {
            return res.status(400).json({
                error: "Missing required fields: ticketId, availableTechnicians (array)"
            });
        }

        // Get ticket details
        const ticketDoc = await db.collection('tickets').doc(ticketId).get();
        if (!ticketDoc.exists) {
            return res.status(404).json({
                error: "Ticket not found"
            });
        }

        const ticketData = ticketDoc.data();

        const prompt = `
As an expert assignment manager, analyze this maintenance ticket and recommend the best technician assignment.

TICKET DETAILS:
Title: ${ticketData?.title}
Description: ${ticketData?.description}
Category: ${ticketData?.category}
Priority: ${ticketData?.priority}
Location: ${ticketData?.location}

AVAILABLE TECHNICIANS:
${availableTechnicians.map((tech: any, index: number) => `
${index + 1}. ${tech.name}
   - ID: ${tech.id}
   - Expertise: ${tech.expertise?.join(', ') || 'General maintenance'}
   - Current Workload: ${tech.workload || 0} active tickets
   - Score: ${tech.score || 0}
   - Available: ${tech.available ? 'Yes' : 'No'}
`).join('\n')}

Consider:
1. Skill match with ticket category
2. Current workload distribution
3. Priority level of the ticket
4. Past performance (if available)
5. Location proximity (if relevant)

Respond with ONLY valid JSON:
{
  "recommendedTechnician": {
    "id": "technician_id",
    "name": "technician_name",
    "confidence": 0.95,
    "reasoning": "detailed explanation"
  },
  "alternativeOptions": [
    {
      "id": "alt_technician_id",
      "name": "alt_name",
      "reasoning": "why this could work"
    }
  ],
  "riskFactors": ["potential", "concerns"],
  "estimatedCompletionTime": "time estimate",
  "recommendedPriority": "high|medium|low"
}`;

        const response = await callGemini({
            messages: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ]
        });

        let recommendation;
        try {
            recommendation = JSON.parse(response);
        } catch (parseError) {
            recommendation = { rawResponse: response };
        }

        return res.status(200).json({
            success: true,
            ticket: {
                id: ticketId,
                category: ticketData?.category,
                priority: ticketData?.priority
            },
            recommendation,
            rawResponse: response
        });

    } catch (error) {
        console.error("Assignment recommendation error:", error);
        return res.status(500).json({
            error: "Internal server error during assignment recommendation",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export {
    testGemini,
    analyzeTicketImage,
    suggestSolution,
    categorizeTicket,
    findSimilarTickets,
    getAssignmentRecommendation
};

export default {
    testGemini,
    analyzeTicketImage,
    suggestSolution,
    categorizeTicket,
    findSimilarTickets,
    getAssignmentRecommendation
};