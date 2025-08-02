import { Router } from "express";
import {
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getNotificationStats,
    subscribeToPush,
    unsubscribeFromPush,
    testNotification,
    testAssignmentEmail
} from "../controllers/notification.controller.js";

const router = Router();

// Static routes first to avoid conflicts with parameterized routes
router.post('/test', testNotification);
router.post('/test-assignment', testAssignmentEmail);

// Parameterized routes after static routes
router.get('/:userId', getUserNotifications);
router.get('/:userId/stats', getNotificationStats);
router.post('/:notificationId/read', markNotificationRead);
router.post('/:userId/read-all', markAllNotificationsRead);
router.post('/:userId/subscribe', subscribeToPush);
router.delete('/:userId/unsubscribe', unsubscribeFromPush);

export default router;