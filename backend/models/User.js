
import mongoose from "mongoose";

// GeoJSON location schema
// Coordinates must be [longitude, latitude]
const locationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["Point"],
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
                message: "Location must contain valid [longitude, latitude] coordinates"
            }
        }
    },
    { _id: false }
);


// NGO details schema
const ngoDetailsSchema = new mongoose.Schema(
    {
        organizationName: {
            type: String,
            trim: true,
            default: ""
        },

        registrationNumber: {
            type: String,
            trim: true,
            default: ""
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        serviceRadiusKm: {
            type: Number,
            min: 1,
            max: 100,
            default: 20
        }
    },
    { _id: false }
);


// Main user schema
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },

        phone: {
            type: String,
            required: true,
            trim: true,
            match: [/^[0-9]{10}$/, "Enter a valid 10-digit phone number"]
        },

        role: {
            type: String,
            enum: ["donor", "ngo", "admin"],
            required: true
        },

        address: {
            type: String,
            trim: true,
            maxlength: 300,
            default: ""
        },

        // Location is optional.
        // Users without coordinates will not get a fake [0, 0] location.
        location: {
            type: locationSchema,
            default: undefined
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        isActive: {
            type: Boolean,
            default: true
        },

        ngoDetails: {
            type: ngoDetailsSchema,
            default: () => ({})
        }
    },
    {
        timestamps: true
    }
);


// Database indexes
userSchema.index({ location: "2dsphere" });
userSchema.index({ role: 1, isActive: 1, isVerified: 1 });


// Create User model
const User = mongoose.model("User", userSchema);

export default User;
