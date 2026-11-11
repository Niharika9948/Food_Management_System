import Notification from "../models/Notification.js";

const emitNotification = (io, notification) => {
    if (!io || !notification?.receiver) {
        return;
    }

    io.to(`user:${notification.receiver}`).emit(
        "newNotification",
        notification
    );
};

export const createNotifications = async ({
    receivers,
    donationId = null,
    message,
    type = "GENERAL",
    io
}) => {
    if (!Array.isArray(receivers) || receivers.length === 0) {
        return [];
    }

    const validReceivers = [
        ...new Set(
            receivers
                .filter(Boolean)
                .map((receiver) => receiver.toString())
        )
    ];

    if (validReceivers.length === 0) {
        return [];
    }

    const notifications = validReceivers.map((receiver) => ({
        receiver,
        donation: donationId,
        message,
        type
    }));

    const createdNotifications = await Notification.insertMany(
        notifications
    );

    for (const notification of createdNotifications) {
        emitNotification(io, notification);
    }

    return createdNotifications;
};

export const createNotification = async ({
    receiver,
    donationId = null,
    message,
    type = "GENERAL",
    io
}) => {
    if (!receiver) {
        throw new Error("Notification receiver is required");
    }

    const notification = await Notification.create({
        receiver,
        donation: donationId,
        message,
        type
    });

    emitNotification(io, notification);

    return notification;
};