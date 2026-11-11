import mongoose from "mongoose";
import Notification from "../models/Notification.js";

const notificationCategories = {
    donations: [
        "NEW_DONATION",
        "DONATION_UPDATED",
        "DONATION_CANCELLED"
    ],
    collections: [
        "DONATION_ACCEPTED",
        "FOOD_PICKED_UP",
        "DONATION_COMPLETED"
    ],
    reminders: [
        "COLLECTION_REMINDER",
        "FOOD_EXPIRY_WARNING",
        "DONATION_EXPIRED"
    ],
    account: [
        "NGO_VERIFICATION",
        "PROFILE_UPDATED",
        "GENERAL"
    ]
};

export const getMyNotifications = async (req, res) => {
    try {
        const { category, status } = req.query;

        const filter = {
            receiver: req.user._id
        };

        if (category && category !== "all") {
            const types = notificationCategories[category];

            if (!types) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid notification category"
                });
            }

            filter.type = { $in: types };
        }

        if (status === "unread") {
            filter.isRead = false;
        } else if (status === "read") {
            filter.isRead = true;
        } else if (status && status !== "all") {
            return res.status(400).json({
                success: false,
                message: "Invalid notification status"
            });
        }

        const notifications = await Notification.find(filter)
            .populate("donation", "foodName quantity unit status")
            .sort({ createdAt: -1 })
            .limit(100);

        const unreadCount = await Notification.countDocuments({
            receiver: req.user._id,
            isRead: false
        });

        return res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            notifications
        });
    } catch (error) {
        console.error("Get notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch notifications"
        });
    }
};

export const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID"
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: id,
                receiver: req.user._id
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        console.error("Mark notification error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update notification"
        });
    }
};

export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const now = new Date();

        const result = await Notification.updateMany(
            {
                receiver: req.user._id,
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: now
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            updatedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("Mark all notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update notifications"
        });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID"
            });
        }

        const notification = await Notification.findOneAndDelete({
            _id: id,
            receiver: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (error) {
        console.error("Delete notification error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete notification"
        });
    }
};

export const deleteReadNotifications = async (req, res) => {
    try {
        const result = await Notification.deleteMany({
            receiver: req.user._id,
            isRead: true
        });

        return res.status(200).json({
            success: true,
            message: "Read notifications deleted successfully",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Delete read notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete read notifications"
        });
    }
};