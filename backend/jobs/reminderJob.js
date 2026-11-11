
import cron from "node-cron";
import FoodDonation from "../models/FoodDonation.js";
import Notification from "../models/Notification.js";
import { createNotifications } from "../services/notificationService.js";

const REMINDER_MINUTES = 60;

let isReminderJobRunning = false;

const sendReminderOnce = async ({
    receivers,
    donationId,
    message,
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
        type: "COLLECTION_REMINDER"
    }).select("receiver");

    const alreadyNotified = new Set(
        existingNotifications.map(
            (notification) => notification.receiver.toString()
        )
    );

    const pendingReceivers = validReceivers.filter(
        (receiver) => !alreadyNotified.has(receiver)
    );

    if (!pendingReceivers.length) return;

    await createNotifications({
        receivers: pendingReceivers,
        donationId,
        message,
        type: "COLLECTION_REMINDER",
        io
    });
};

export const startReminderJob = (io) => {
    cron.schedule("* * * * *", async () => {
        if (isReminderJobRunning) return;

        isReminderJobRunning = true;

        try {
            const now = new Date();

            const reminderLimit = new Date(
                now.getTime() + REMINDER_MINUTES * 60 * 1000
            );

            const donations = await FoodDonation.find({
                status: "ACCEPTED",
                ngo: { $ne: null },
                collectionDeadline: {
                    $gt: now,
                    $lte: reminderLimit
                }
            }).select("_id donor ngo foodName collectionDeadline");

            for (const donation of donations) {
                try {
                    await sendReminderOnce({
                        receivers: [
                            donation.donor,
                            donation.ngo
                        ],
                        donationId: donation._id,
                        message: `Reminder: The collection deadline for "${donation.foodName}" is approaching. Please arrange pickup as soon as possible.`,
                        io
                    });

                    console.log(
                        `Collection reminder checked: ${donation._id}`
                    );
                } catch (error) {
                    console.error(
                        `Collection reminder error for ${donation._id}:`,
                        error.message
                    );
                }
            }

        } catch (error) {
            console.error(
                "Collection reminder job error:",
                error
            );
        } finally {
            isReminderJobRunning = false;
        }
    });

    console.log("Automatic collection reminder job started");
};
