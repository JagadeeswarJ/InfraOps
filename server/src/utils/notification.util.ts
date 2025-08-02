import { db } from '../config/db.config.js';
import { FieldValue } from 'firebase-admin/firestore';
import { Notification, Ticket, User } from './types.js';
import { sendEmail } from './email.util.js';
// import { getTemplateContent } from './template.util.js';

export interface NotificationPayload {
    userId: string;
    type: 'ticket_status' | 'assignment' | 'feedback_request' | 'overdue_alert' | 'new_assignment';
    ticketId?: string;
    title: string;
    message: string;
    data?: any;
    priority?: 'low' | 'medium' | 'high';
}

export interface PushNotificationData {
    title: string;
    body: string;
    data?: any;
    priority?: 'normal' | 'high';
    badge?: number;
}

// In-memory storage for notification subscriptions (in production, use Redis)
const notificationSubscriptions = new Map<string, any[]>();

export const createNotification = async (payload: NotificationPayload): Promise<string> => {
    try {
        console.log(`📝 Creating notification for user ${payload.userId}, type: ${payload.type}`);
        
        const notification: Notification = {
            userId: payload.userId,
            type: payload.type,
            ticketId: payload.ticketId,
            message: payload.message,
            sentAt: FieldValue.serverTimestamp() as any,
            read: false
        };

        const notificationRef = await db.collection('notifications').add(notification);
        console.log(`✅ Notification document created with ID: ${notificationRef.id}`);
        
        // Send push notification
        console.log(`📱 Sending push notification...`);
        await sendPushNotification(payload.userId, {
            title: payload.title,
            body: payload.message,
            data: {
                notificationId: notificationRef.id,
                ticketId: payload.ticketId,
                type: payload.type,
                ...payload.data
            },
            priority: payload.priority === 'high' ? 'high' : 'normal'
        });

        // Send email notification for high priority or specific types
        if (payload.priority === 'high' || ['new_assignment', 'assignment', 'overdue_alert'].includes(payload.type)) {
            console.log(`📧 Sending email notification (priority: ${payload.priority}, type: ${payload.type})`);
            await sendEmailNotification(payload);
            console.log(`✅ Email notification process completed`);
        } else {
            console.log(`⏭️ Skipping email notification (priority: ${payload.priority}, type: ${payload.type})`);
        }

        return notificationRef.id;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        throw error;
    }
};

export const sendPushNotification = async (userId: string, payload: PushNotificationData): Promise<void> => {
    try {
        const subscriptions = notificationSubscriptions.get(userId) || [];
        
        if (subscriptions.length === 0) {
            console.log(`No push subscriptions found for user: ${userId}`);
            return;
        }

        // In a real implementation, you would use Firebase Cloud Messaging or similar
        console.log(`Sending push notification to user ${userId}:`, payload);
        
        // Simulate push notification sending
        subscriptions.forEach(subscription => {
            console.log(`Push sent to subscription: ${subscription.endpoint}`);
        });

        // Update notification badge count
        await updateNotificationBadge(userId);
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

export const sendEmailNotification = async (payload: NotificationPayload): Promise<void> => {
    try {
        console.log(`📧 Starting email notification process for user: ${payload.userId}`);
        
        // Get user email
        const userDoc = await db.collection('users').doc(payload.userId).get();
        if (!userDoc.exists) {
            console.log(`❌ User not found: ${payload.userId}`);
            return;
        }

        const userData = userDoc.data() as User;
        if (!userData.email) {
            console.log(`❌ No email found for user: ${payload.userId}`);
            return;
        }
        
        console.log(`✅ User email found: ${userData.email}`);

        // Get ticket data if available
        let ticketData = null;
        if (payload.ticketId) {
            const ticketDoc = await db.collection('tickets').doc(payload.ticketId).get();
            if (ticketDoc.exists) {
                ticketData = { id: payload.ticketId, ...ticketDoc.data() } as Ticket & { id: string };
                console.log(`📧 Ticket data loaded for email:`, {
                    id: ticketData.id,
                    title: ticketData.title,
                    category: ticketData.category,
                    location: ticketData.location,
                    priority: ticketData.priority,
                    images: ticketData.images?.length || 0,
                    hasRequiredTools: !!(ticketData.requiredTools?.length),
                    hasRequiredMaterials: !!(ticketData.requiredMaterials?.length)
                });
            } else {
                console.warn(`⚠️ Ticket ${payload.ticketId} not found for email notification`);
            }
        }

        // Get the proper template name from email content generation
        const templateConfig = getTemplateConfigForType(payload.type, payload.data);
        
        // Prepare comprehensive template data
        const templateData = {
            user: userData,
            ticket: ticketData,
            message: payload.message,
            title: payload.title,
            data: payload.data, // Include all the payload data for template
            timestamp: new Date().toLocaleDateString()
        };

        console.log(`📧 Sending email to ${userData.email}:`, {
            template: templateConfig.template,
            subject: templateConfig.subject,
            hasTicket: !!ticketData,
            ticketId: ticketData?.id,
            dataKeys: Object.keys(payload.data || {})
        });
        
        await sendEmail(
            userData.email,
            `${templateConfig.subject}: ${ticketData?.title || 'Maintenance Request'}`,
            templateConfig.template,
            templateData
        );

        console.log(`Email notification sent to ${userData.email} for ${payload.type}`);
    } catch (error) {
        console.error('Error sending email notification:', error);
    }
};

// Helper function to get template configuration
const getTemplateConfigForType = (type: string, data?: any) => {
    const templates = {
        'new_assignment': {
            subject: `${data?.assignmentMethod === 'AI Recommendation' ? '🤖 AI-Recommended' : 'New'} Ticket Assigned`,
            template: data?.assignmentMethod === 'AI Recommendation' ? 'ai-ticket-assignment-simple' : 'ticket-assignment'
        },
        'assignment': {
            subject: `✅ Your Ticket Has Been Assigned`,
            template: 'ticket-assigned-notification'
        },
        'ticket_status': {
            subject: `Ticket Status Update`,
            template: 'ticket-status-update'
        },
        'overdue_alert': {
            subject: `⚠️ Overdue Alert`,
            template: 'overdue-alert'
        },
        'feedback_request': {
            subject: `Feedback Request`,
            template: 'feedback-request'
        }
    };

    return templates[type as keyof typeof templates] || {
        subject: 'Bitnap Notification',
        template: 'generic-notification'
    };
};

export const generateEmailContent = async (
    type: string,
    user: User,
    ticket: (Ticket & { id: string }) | null,
    payload: NotificationPayload
): Promise<{ subject: string; html: string }> => {
    const templates = {
        'new_assignment': {
            subject: `${payload.data?.assignmentMethod === 'AI Recommendation' ? '🤖 AI-Recommended' : 'New'} Ticket Assigned: ${ticket?.title || 'Maintenance Request'}`,
            template: payload.data?.assignmentMethod === 'AI Recommendation' ? 'ai-ticket-assignment.html' : 'ticket-assignment.html'
        },
        'assignment': {
            subject: `✅ Your Ticket Has Been Assigned: ${ticket?.title || 'Maintenance Request'}`,
            template: 'ticket-assigned-notification.html'
        },
        'ticket_status': {
            subject: `Ticket Status Update: ${ticket?.title || 'Maintenance Request'}`,
            template: 'ticket-status-update.html'
        },
        'overdue_alert': {
            subject: `⚠️ Overdue Alert: ${ticket?.title || 'Maintenance Request'}`,
            template: 'overdue-alert.html'
        },
        'feedback_request': {
            subject: `Feedback Request: ${ticket?.title || 'Maintenance Request'}`,
            template: 'feedback-request.html'
        }
    };

    const config = templates[type as keyof typeof templates] || {
        subject: 'Bitnap Notification',
        template: 'generic-notification.html'
    };

    const templateData = {
        user,
        ticket,
        message: payload.message,
        title: payload.title,
        timestamp: new Date().toLocaleDateString(),
        data: payload.data
    };

    // For now, return a simple HTML template
    const html = `
    <html>
        <body>
            <h2>${config.subject}</h2>
            <p>Hello ${user.name},</p>
            <p>${payload.message}</p>
            ${ticket ? `
                <div>
                    <h3>${ticket.title}</h3>
                    <p>Category: ${ticket.category}</p>
                    <p>Location: ${ticket.location}</p>
                    <p>Priority: ${ticket.priority}</p>
                </div>
            ` : ''}
            <p>Best regards,<br>Bitnap Maintenance Team</p>
        </body>
    </html>
    `;

    return {
        subject: config.subject,
        html
    };
};

export const updateNotificationBadge = async (userId: string): Promise<number> => {
    try {
        const unreadQuery = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .get();

        const badgeCount = unreadQuery.size;
        
        // Store badge count for user (in production, use Redis)
        // This would be used by the client to display badge
        console.log(`Badge updated for user ${userId}: ${badgeCount} unread notifications`);
        
        return badgeCount;
    } catch (error) {
        console.error('Error updating notification badge:', error);
        return 0;
    }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
        await db.collection('notifications').doc(notificationId).update({
            read: true,
            readAt: FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    try {
        const unreadQuery = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .get();

        const batch = db.batch();
        unreadQuery.docs.forEach(doc => {
            batch.update(doc.ref, {
                read: true,
                readAt: FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

export const subscribeToNotifications = (userId: string, subscription: any): void => {
    const userSubscriptions = notificationSubscriptions.get(userId) || [];
    userSubscriptions.push(subscription);
    notificationSubscriptions.set(userId, userSubscriptions);
    console.log(`User ${userId} subscribed to push notifications`);
};

export const unsubscribeFromNotifications = (userId: string, endpoint: string): void => {
    const userSubscriptions = notificationSubscriptions.get(userId) || [];
    const filteredSubscriptions = userSubscriptions.filter(sub => sub.endpoint !== endpoint);
    notificationSubscriptions.set(userId, filteredSubscriptions);
    console.log(`User ${userId} unsubscribed from push notifications`);
};

// Notification trigger functions for different ticket events
export const notifyTicketAssigned = async (
    ticketId: string, 
    technicianId: string, 
    assignedBy?: string,
    assignmentData?: {
        method?: string;
        reason?: string;
        score?: number;
        estimatedDuration?: string;
    }
): Promise<void> => {
    try {
        console.log(`🚀 Starting notification process for ticket ${ticketId} to technician ${technicianId}`);
        
        const ticketDoc = await db.collection('tickets').doc(ticketId).get();
        if (!ticketDoc.exists) {
            console.log(`❌ Ticket ${ticketId} not found`);
            return;
        }

        const ticketData = ticketDoc.data() as Ticket;
        console.log(`✅ Ticket data loaded: ${ticketData.title}`);
        
        // Get technician details for email
        const technicianDoc = await db.collection('users').doc(technicianId).get();
        const technicianData = technicianDoc.exists ? technicianDoc.data() : null;
        console.log(`✅ Technician data loaded: ${technicianData?.name || 'Unknown'}`);

        // Get community details for address information
        let communityData = null;
        if (ticketData.communityId) {
            const communityDoc = await db.collection('communities').doc(ticketData.communityId).get();
            if (communityDoc.exists) {
                communityData = communityDoc.data();
                console.log(`✅ Community data loaded: ${communityData?.name} at ${communityData?.address}`);
            } else {
                console.log(`⚠️ Community ${ticketData.communityId} not found`);
            }
        }

        // Get reporter details for mobile number
        let reporterData = null;
        if (ticketData.reportedBy) {
            const reporterDoc = await db.collection('users').doc(ticketData.reportedBy).get();
            if (reporterDoc.exists) {
                reporterData = reporterDoc.data();
                console.log(`✅ Reporter data loaded: ${reporterData?.name} - ${reporterData?.mobile || 'No mobile'}`);
            } else {
                console.log(`⚠️ Reporter ${ticketData.reportedBy} not found`);
            }
        }

        // Send notification to technician
        console.log(`📧 Creating notification for technician...`);
        
        // Use AI-predicted category if available, fallback to database category
        const categoryToUse = ticketData.aiMetadata?.predictedCategory || ticketData.category;
        console.log(`📊 Using category: ${categoryToUse} (AI: ${ticketData.aiMetadata?.predictedCategory}, DB: ${ticketData.category})`);
        
        await createNotification({
            userId: technicianId,
            type: 'new_assignment',
            ticketId,
            title: 'New Ticket Assigned',
            message: `You have been assigned a new ${categoryToUse} ticket: ${ticketData.title}`,
            priority: ticketData.priority === 'high' ? 'high' : 'medium',
            data: {
                category: categoryToUse, // Use AI-predicted category
                dbCategory: ticketData.category, // Keep original for reference
                location: ticketData.location,
                assignedBy,
                assignmentMethod: assignmentData?.method || 'Manual',
                assignmentReason: assignmentData?.reason,
                assignmentScore: assignmentData?.score,
                estimatedDuration: assignmentData?.estimatedDuration,
                // Include all AI-generated data from ticket
                requiredTools: ticketData.requiredTools || [],
                requiredMaterials: ticketData.requiredMaterials || [],
                difficultyLevel: ticketData.difficultyLevel,
                // Community address information
                communityName: communityData?.name || 'Unknown Community',
                communityAddress: communityData?.address || 'Address not available',
                // Reporter contact information
                reporterName: reporterData?.name || 'Unknown Reporter',
                reporterMobile: reporterData?.mobile || 'Mobile not available',
                reporterEmail: reporterData?.email || 'Email not available',
            }
        });
        console.log(`✅ Technician notification created successfully`);

        // Also notify the ticket reporter that their ticket has been assigned
        if (ticketData.reportedBy && ticketData.reportedBy !== technicianId) {
            console.log(`📧 Creating notification for ticket reporter...`);
            await createNotification({
                userId: ticketData.reportedBy,
                type: 'assignment',
                ticketId,
                title: 'Your Ticket Has Been Assigned',
                message: `Your ${categoryToUse} ticket "${ticketData.title}" has been assigned to a technician`,
                priority: 'medium',
                data: {
                    category: categoryToUse, // Use AI-predicted category
                    dbCategory: ticketData.category, // Keep original for reference
                    location: ticketData.location,
                    technicianName: technicianData?.name || 'Technician',
                    technicianExpertise: (technicianData?.expertise || []).join(', ') || 'General maintenance',
                    assignmentMethod: assignmentData?.method || 'Manual',
                    assignmentReason: assignmentData?.reason,
                    estimatedDuration: assignmentData?.estimatedDuration,
                }
            });
            console.log(`✅ Reporter notification created successfully`);
        }
    } catch (error) {
        console.error(`❌ Error in notifyTicketAssigned for ticket ${ticketId}:`, error);
        throw error;
    }
};

export const notifyTicketStatusChanged = async (
    ticketId: string, 
    newStatus: string, 
    previousStatus: string,
    updatedBy?: string
): Promise<void> => {
    const ticketDoc = await db.collection('tickets').doc(ticketId).get();
    if (!ticketDoc.exists) return;

    const ticketData = ticketDoc.data() as Ticket;
    
    // Notify reporter
    await createNotification({
        userId: ticketData.reportedBy,
        type: 'ticket_status',
        ticketId,
        title: 'Ticket Status Update',
        message: `Your ticket "${ticketData.title}" status changed from ${previousStatus} to ${newStatus}`,
        priority: newStatus === 'resolved' ? 'high' : 'medium',
        data: {
            newStatus,
            previousStatus,
            updatedBy
        }
    });

    // Notify technician if assigned
    if (ticketData.assignedTo && ticketData.assignedTo !== updatedBy) {
        await createNotification({
            userId: ticketData.assignedTo,
            type: 'ticket_status',
            ticketId,
            title: 'Ticket Status Update',
            message: `Ticket "${ticketData.title}" status changed to ${newStatus}`,
            priority: 'medium',
            data: {
                newStatus,
                previousStatus,
                updatedBy
            }
        });
    }
};

export const notifyTicketOverdue = async (ticketId: string): Promise<void> => {
    const ticketDoc = await db.collection('tickets').doc(ticketId).get();
    if (!ticketDoc.exists) return;

    const ticketData = ticketDoc.data() as Ticket;

    if (ticketData.assignedTo) {
        await createNotification({
            userId: ticketData.assignedTo,
            type: 'overdue_alert',
            ticketId,
            title: '⚠️ Overdue Ticket Alert',
            message: `Ticket "${ticketData.title}" is overdue and requires immediate attention`,
            priority: 'high',
            data: {
                category: ticketData.category,
                location: ticketData.location,
                priority: ticketData.priority
            }
        });
    }
};

export const notifyFeedbackRequest = async (ticketId: string, residentId: string): Promise<void> => {
    const ticketDoc = await db.collection('tickets').doc(ticketId).get();
    if (!ticketDoc.exists) return;

    const ticketData = ticketDoc.data() as Ticket;

    await createNotification({
        userId: residentId,
        type: 'feedback_request',
        ticketId,
        title: 'Feedback Request',
        message: `Please provide feedback for the completed ticket: ${ticketData.title}`,
        priority: 'medium',
        data: {
            category: ticketData.category,
            technicianId: ticketData.assignedTo
        }
    });
};

export default {
    createNotification,
    sendPushNotification,
    sendEmailNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    notifyTicketAssigned,
    notifyTicketStatusChanged,
    notifyTicketOverdue,
    notifyFeedbackRequest
};