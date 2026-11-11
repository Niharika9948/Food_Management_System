import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteReadNotifications
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyNotifications);

router.patch("/read-all", markAllNotificationsAsRead);

router.patch("/:id/read", markNotificationAsRead);

router.delete("/read", deleteReadNotifications);

router.delete("/:id", deleteNotification);

export default router;