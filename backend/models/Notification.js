import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        donation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodDonation",
            default: null
        },
        message: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 500
        },
        type: {
            type: String,
            enum: [
                "NEW_DONATION",
                "DONATION_ACCEPTED",
                "COLLECTION_REMINDER",
                "FOOD_EXPIRY_WARNING",
                "DONATION_CANCELLED",
                "DONATION_UPDATED",
                "FOOD_PICKED_UP",
                "DONATION_COMPLETED",
                "DONATION_EXPIRED",
                "NGO_VERIFICATION",
                "PROFILE_UPDATED",
                "GENERAL"
            ],
            default: "GENERAL",
            required: true
        },
        isRead: {
            type: Boolean,
            default: false
        },
        readAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({
    receiver: 1,
    createdAt: -1
});

notificationSchema.index({
    receiver: 1,
    isRead: 1
});

notificationSchema.index({
    donation: 1
});

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;