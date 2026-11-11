
import cron from "node-cron";
import FoodDonation from "../models/FoodDonation.js";
import Notification from "../models/Notification.js";
import { createNotifications } from "../services/notificationService.js";

const WARNING_MINUTES = 60;

let isJobRunning = false;

// Send a notification only if that receiver has not already received it
const sendNotificationOnce = async ({
    receivers,
    donationId,
    message,
    type,
    io
}) => {
    const validReceivers = [
        ...new Set(
            receivers
                .filter(Boolean)
                .map((receiver) => receiver.toString())
        )
    ];

    if (!validReceivers.length) return;

    const existingNotifications = await Notification.find({
        receiver: { $in: validReceivers },
        donation: donationId,
        type
    }).select("receiver");

    const alreadyNotified = new Set(
        existingNotifications.map((item) => item.receiver.toString())
    );

    const pendingReceivers = validReceivers.filter(
        (receiver) => !alreadyNotified.has(receiver)
    );

    if (!pendingReceivers.length) return;

    await createNotifications({
        receivers: pendingReceivers,
        donationId,
        message,
        type,
        io
    });
};

export const startExpiryJob = (io) => {
    cron.schedule("* * * * *", async () => {
        if (isJobRunning) return;

        isJobRunning = true;

        try {
            const now = new Date();

            // 1. FOOD EXPIRY WARNING
            // Notify one hour before food expiry.

            const warningLimit = new Date(
                now.getTime() + WARNING_MINUTES * 60 * 1000
            );

            const donationsNearExpiry = await FoodDonation.find({
                status: { $in: ["AVAILABLE", "ACCEPTED"] },
                expiryTime: {
                    $gt: now,
                    $lte: warningLimit
                }
            }).select("_id donor ngo foodName");

            for (const item of donationsNearExpiry) {
                try {
                    const receivers = [
                        item.donor,
                        item.ngo
                    ].filter(Boolean);

                    await sendNotificationOnce({
                        receivers,
                        donationId: item._id,
                        message: `Food donation "${item.foodName}" is approaching its expiry time. Please arrange collection as soon as possible.`,
                        type: "FOOD_EXPIRY_WARNING",
                        io
                    });

                    console.log(
                        `Expiry warning checked: ${item._id}`
                    );
                } catch (error) {
                    console.error(
                        "Expiry warning notification error:",
                        error.message
                    );
                }
            }

            // 2. AUTOMATIC DONATION EXPIRY

            const expiredDonations = await FoodDonation.find({
                status: { $in: ["AVAILABLE", "ACCEPTED"] },
                $or: [
                    { expiryTime: { $lte: now } },
                    { collectionDeadline: { $lte: now } }
                ]
            }).select("_id donor ngo foodName");

            for (const item of expiredDonations) {
                try {
                    const donation = await FoodDonation.findOneAndUpdate(
                        {
                            _id: item._id,
                            status: { $in: ["AVAILABLE", "ACCEPTED"] },
                            $or: [
                                { expiryTime: { $lte: now } },
                                { collectionDeadline: { $lte: now } }
                            ]
                        },
                        {
                            $set: {
                                status: "EXPIRED"
                            }
                        },
                        {
                            new: true
                        }
                    );

                    if (!donation) continue;

                    const receivers = [
                        item.donor,
                        item.ngo
                    ].filter(Boolean);

                    await sendNotificationOnce({
                        receivers,
                        donationId: item._id,
                        message: `Your food donation "${item.foodName}" has expired or passed its collection deadline.`,
                        type: "DONATION_EXPIRED",
                        io
                    });

                    console.log(
                        `Donation expired: ${item._id}`
                    );
                } catch (error) {
                    console.error(
                        `Expiry processing error for ${item._id}:`,
                        error.message
                    );
                }
            }

        } catch (error) {
            console.error("Food expiry job error:", error);
        } finally {
            isJobRunning = false;
        }
    });

    console.log("Automatic food expiry and warning job started");
};
