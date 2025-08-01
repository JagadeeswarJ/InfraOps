import { Router } from "express";
import {
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getNotificationStats,
    subscribeToPush,
    unsubscribeFromPush,
    testNotification
} from "../controllers/notification.controller.js";

const router = Router();

// GET /api/notifications/:userId - Get user notifications
router.get('/:userId', getUserNotifications);

// GET /api/notifications/:userId/stats - Get notification statistics
router.get('/:userId/stats', getNotificationStats);

// POST /api/notifications/:notificationId/read - Mark notification as read
router.post('/:notificationId/read', markNotificationRead);

// POST /api/notifications/:userId/read-all - Mark all notifications as read
router.post('/:userId/read-all', markAllNotificationsRead);

// POST /api/notifications/:userId/subscribe - Subscribe to push notifications
router.post('/:userId/subscribe', subscribeToPush);

// DELETE /api/notifications/:userId/unsubscribe - Unsubscribe from push notifications
router.delete('/:userId/unsubscribe', unsubscribeFromPush);

// POST /api/notifications/test - Test notification (development only)
router.post('/test', testNotification);

export default router;