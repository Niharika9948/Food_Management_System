
import mongoose from "mongoose";

const foodDonationSchema = new mongoose.Schema(
    {
        // Donor information
        donor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // NGO that accepted the donation
        ngo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // Food information
        foodName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        category: {
            type: String,
            enum: [
                "Vegetarian",
                "Non-Vegetarian",
                "Bakery",
                "Fruits",
                "Other"
            ],
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
            max: 100000
        },

        unit: {
            type: String,
            enum: ["plates", "kg", "packets", "boxes"],
            required: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        // Legacy single image URL
        imageUrl: {
            type: String,
            trim: true,
            default: ""
        },

        // Multiple Cloudinary images
        images: {
            type: [
                {
                    url: {
                        type: String,
                        required: true
                    },
                    publicId: {
                        type: String,
                        required: true
                    }
                }
            ],
            default: [],
            validate: {
                validator: function (images) {
                    return images.length <= 5;
                },
                message: "Maximum 5 food images are allowed"
            }
        },

        // Food preparation and expiry
        preparationTime: {
            type: Date,
            required: true
        },

        expiryTime: {
            type: Date,
            required: true
        },

        collectionDeadline: {
            type: Date,
            required: true
        },

        // Pickup address
        address: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        },

        // GeoJSON location
        // Coordinates: [longitude, latitude]
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
                default: "Point"
            },

            coordinates: {
                type: [Number],
                required: true,

                validate: {
                    validator: function (coordinates) {
                        return (
                            Array.isArray(coordinates) &&
                            coordinates.length === 2 &&
                            Number.isFinite(coordinates[0]) &&
                            Number.isFinite(coordinates[1]) &&
                            coordinates[0] >= -180 &&
                            coordinates[0] <= 180 &&
                            coordinates[1] >= -90 &&
                            coordinates[1] <= 90
                        );
                    },
                    message: "Provide valid [longitude, latitude] coordinates"
                }
            }
        },

        // Food safety information
        allergens: {
    type: [{
        type: String,
        trim: true,
        maxlength: 50
    }],
    default: [],
    validate: {
        validator: (values) =>
            values.length === new Set(
                values.map((value) => value.toLowerCase())
            ).size,
        message: "Duplicate allergens are not allowed"
    }
},

        dietaryTags: {
            type: [String],
            enum: [
                "Vegetarian",
                "Vegan",
                "Gluten-Free",
                "Dairy-Free",
                "Contains Nuts",
                "Egg-Free"
            ],
            default: []
        },

        storageInstructions: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        storageTemperature: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        },

        // Collection information
        pickupInstructions: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },

        preferredPickupTime: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        },

        // Donation status
        status: {
            type: String,
            enum: [
                "AVAILABLE",
                "ACCEPTED",
                "PICKED_UP",
                "COMPLETED",
                "EXPIRED",
                "CANCELLED"
            ],
            default: "AVAILABLE"
        },

        // Donation tracking timestamps
        acceptedAt: {
            type: Date,
            default: null
        },

        pickedUpAt: {
            type: Date,
            default: null
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// ============================================
// DATE VALIDATION
// ============================================

foodDonationSchema.pre("validate", function () {
    if (
        this.preparationTime &&
        this.expiryTime &&
        this.expiryTime <= this.preparationTime
    ) {
        this.invalidate(
            "expiryTime",
            "Expiry time must be after preparation time"
        );
    }

    if (
        this.preparationTime &&
        this.collectionDeadline &&
        this.collectionDeadline < this.preparationTime
    ) {
        this.invalidate(
            "collectionDeadline",
            "Collection deadline cannot be before preparation time"
        );
    }

    if (
        this.collectionDeadline &&
        this.expiryTime &&
        this.collectionDeadline > this.expiryTime
    ) {
        this.invalidate(
            "collectionDeadline",
            "Collection deadline cannot be after expiry time"
        );
    }
});

// ============================================
// DATABASE INDEXES
// ============================================

foodDonationSchema.index({
    location: "2dsphere"
});

foodDonationSchema.index({
    status: 1,
    collectionDeadline: 1
});

foodDonationSchema.index({
    status: 1,
    expiryTime: 1
});

foodDonationSchema.index({
    donor: 1,
    createdAt: -1
});

foodDonationSchema.index({
    ngo: 1,
    status: 1
});

// ============================================
// MODEL
// ============================================

const FoodDonation = mongoose.model(
    "FoodDonation",
    foodDonationSchema
);

export default FoodDonation;
