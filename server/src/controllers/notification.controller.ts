import { Request, Response } from "express";
import { db } from "../config/db.config.js";
import { 
    markNotificationAsRead as markAsRead,
    markAllNotificationsAsRead as markAllAsRead,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    createNotification,
    updateNotificationBadge,
    notifyTicketAssigned
} from "../utils/notification.util.js";

const getUserNotifications = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.params;
        const { limit = 20, offset = 0, unreadOnly = false } = req.query;

        if (!userId) {
            return res.status(400).json({
                error: "User ID is required"
            });
        }

        let query = db.collection('notifications')
            .where('userId', '==', userId)
            .orderBy('sentAt', 'desc');

        if (unreadOnly === 'true') {
            query = query.where('read', '==', false);
        }

        const notificationsQuery = await query
            .limit(Number(limit))
            .offset(Number(offset))
            .get();

        const notifications = notificationsQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Get unread count
        const unreadQuery = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .get();

        return res.status(200).json({
            success: true,
            notifications,
            pagination: {
                limit: Number(limit),
                offset: Number(offset),
                total: notifications.length,
                hasMore: notifications.length === Number(limit)
            },
            unreadCount: unreadQuery.size
        });

    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching notifications"
        });
    }
};

const getNotificationStats = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                error: "User ID is required"
            });
        }

        // Get notification counts by type and status
        const [allNotifications, unreadNotifications] = await Promise.all([
            db.collection('notifications').where('userId', '==', userId).get(),
            db.collection('notifications').where('userId', '==', userId).where('read', '==', false).get()
        ]);

        const all = allNotifications.docs.map(doc => doc.data());
        const unread = unreadNotifications.docs.map(doc => doc.data());

        // Group by type
        const typeStats = all.reduce((acc: any, notification: any) => {
            const type = notification.type;
            if (!acc[type]) {
                acc[type] = { total: 0, unread: 0 };
            }
            acc[type].total++;
            return acc;
        }, {});

        unread.forEach((notification: any) => {
            const type = notification.type;
            if (typeStats[type]) {
                typeStats[type].unread++;
            }
        });

        return res.status(200).json({
            success: true,
            stats: {
                total: all.length,
                unread: unread.length,
                byType: typeStats
            }
        });

    } catch (error) {
        console.error("Get notification stats error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching notification stats"
        });
    }
};

const markNotificationRead = async (req: Request, res: Response): Promise<any> => {
    try {
        const { notificationId } = req.params;

        if (!notificationId) {
            return res.status(400).json({
                error: "Notification ID is required"
            });
        }

        await markAsRead(notificationId);

        return res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });

    } catch (error) {
        console.error("Mark notification read error:", error);
        return res.status(500).json({
            error: "Internal server error while marking notification as read"
        });
    }
};

const markAllNotificationsRead = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                error: "User ID is required"
            });
        }

        await markAllAsRead(userId);

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });

    } catch (error) {
        console.error("Mark all notifications read error:", error);
        return res.status(500).json({
            error: "Internal server error while marking all notifications as read"
        });
    }
};

const subscribeToPush = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.params;
        const { subscription } = req.body;

        if (!userId || !subscription) {
            return res.status(400).json({
                error: "User ID and subscription are required"
            });
        }

        subscribeToNotifications(userId, subscription);

        return res.status(200).json({
            success: true,
            message: "Successfully subscribed to push notifications"
        });

    } catch (error) {
        console.error("Subscribe to push error:", error);
        return res.status(500).json({
            error: "Internal server error while subscribing to notifications"
        });
    }
};

const unsubscribeFromPush = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.params;
        const { endpoint } = req.body;

        if (!userId || !endpoint) {
            return res.status(400).json({
                error: "User ID and endpoint are required"
            });
        }

        unsubscribeFromNotifications(userId, endpoint);

        return res.status(200).json({
            success: true,
            message: "Successfully unsubscribed from push notifications"
        });

    } catch (error) {
        console.error("Unsubscribe from push error:", error);
        return res.status(500).json({
            error: "Internal server error while unsubscribing from notifications"
        });
    }
};

const testNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, type, message, title, ticketId } = req.body;

        if (!userId || !type || !message || !title) {
            return res.status(400).json({
                error: "Missing required fields: userId, type, message, title"
            });
        }

        const notificationId = await createNotification({
            userId,
            type,
            message,
            title,
            ticketId,
            priority: 'medium'
        });

        return res.status(200).json({
            success: true,
            message: "Test notification sent successfully",
            notificationId
        });

    } catch (error) {
        console.error("Test notification error:", error);
        return res.status(500).json({
            error: "Internal server error while sending test notification"
        });
    }
};

const testAssignmentEmail = async (req: Request, res: Response): Promise<any> => {
    try {
        const { ticketId, technicianId } = req.body;

        if (!ticketId || !technicianId) {
            return res.status(400).json({
                error: "ticketId and technicianId are required"
            });
        }

        console.log(`🧪 Testing assignment email for ticket ${ticketId} to technician ${technicianId}`);

        // Call the notification function with test data
        await notifyTicketAssigned(ticketId, technicianId, 'test-system', {
            method: 'AI Recommendation',
            reason: 'You have the highest skill match for plumbing issues in your area',
            score: 95,
            estimatedDuration: '2-3 hours'
        });

        return res.status(200).json({
            success: true,
            message: "Test assignment email sent successfully",
            ticketId,
            technicianId
        });

    } catch (error) {
        console.error("Test assignment email error:", error);
        return res.status(500).json({
            error: "Internal server error while sending test assignment email",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export {
    getUserNotifications,
    getNotificationStats,
    markNotificationRead,
    markAllNotificationsRead,
    subscribeToPush,
    unsubscribeFromPush,
    testNotification,
    testAssignmentEmail
};