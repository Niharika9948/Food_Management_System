
import mongoose from "mongoose";
import User from "../models/User.js";
import FoodDonation from "../models/FoodDonation.js";
import { createNotification } from "../services/notificationService.js";

// ============================================
// CHECK VERIFIED NGO
// ============================================

const checkVerifiedNgo = (req, res) => {
    if (req.user.role !== "ngo" || !req.user.isVerified) {
        res.status(403).json({
            success: false,
            message: "Only verified NGOs can perform this action"
        });

        return false;
    }

    return true;
};


// ============================================
// SAFE NOTIFICATION HELPER
// ============================================

const sendDonationNotification = async ({
    receiver,
    donation,
    message,
    type,
    io
}) => {
    try {
        await createNotification({
            receiver,
            donationId: donation._id,
            message,
            type,
            io
        });
    } catch (error) {
        // Notification failure should not undo
        // an already completed donation operation.
        console.error("Notification error:", error.message);
    }
};


// ============================================
// 1. ACCEPT FOOD DONATION
// ============================================

export const acceptDonation = async (req, res) => {
    try {
        if (!checkVerifiedNgo(req, res)) return;

        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid donation ID"
            });
        }

        const now = new Date();

        // Atomic update prevents multiple NGOs
        // from accepting the same donation.

        const donation = await FoodDonation.findOneAndUpdate(
            {
                _id: id,
                status: "AVAILABLE",
                collectionDeadline: { $gt: now },
                expiryTime: { $gt: now }
            },
            {
                $set: {
                    ngo: req.user._id,
                    status: "ACCEPTED",
                    acceptedAt: now
                }
            },
            {
                new: true,
                runValidators: true
            }
        ).populate("donor", "name email phone");

        if (!donation) {
            return res.status(409).json({
                success: false,
                message: "Donation is unavailable, expired or already accepted"
            });
        }

        await sendDonationNotification({
            receiver: donation.donor._id,
            donation,
            message: `${req.user.name} accepted your food donation: ${donation.foodName}`,
            type: "DONATION_ACCEPTED",
            io: req.app.get("io")
        });

        return res.status(200).json({
            success: true,
            message: "Food donation accepted successfully",
            donation
        });

    } catch (error) {
        console.error("Accept donation error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to accept donation"
        });
    }
};


// ============================================
// 2. GET NGO'S ACCEPTED DONATIONS
// ============================================

export const getMyAcceptedDonations = async (req, res) => {
    try {
        if (!checkVerifiedNgo(req, res)) return;

        const donations = await FoodDonation.find({
            ngo: req.user._id,
            status: {
                $in: ["ACCEPTED", "PICKED_UP", "COMPLETED"]
            }
        })
            .populate("donor", "name email phone address")
            .sort({ acceptedAt: -1 });

        return res.status(200).json({
            success: true,
            count: donations.length,
            donations
        });

    } catch (error) {
        console.error("Accepted donations error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch accepted donations"
        });
    }
};


// ============================================
// 3. MARK DONATION AS PICKED UP
// ============================================

export const markDonationPickedUp = async (req, res) => {
    try {
        if (!checkVerifiedNgo(req, res)) return;

        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid donation ID"
            });
        }

        const now = new Date();

        const donation = await FoodDonation.findOneAndUpdate(
            {
                _id: id,
                ngo: req.user._id,
                status: "ACCEPTED",
                collectionDeadline: { $gt: now },
                expiryTime: { $gt: now }
            },
            {
                $set: {
                    status: "PICKED_UP",
                    pickedUpAt: now
                }
            },
            {
                new: true,
                runValidators: true
            }
        ).populate("donor", "name email phone");

        if (!donation) {
            return res.status(409).json({
                success: false,
                message: "Donation cannot be marked as picked up. Check its status or deadline."
            });
        }

        await sendDonationNotification({
            receiver: donation.donor._id,
            donation,
            message: `Your food donation ${donation.foodName} has been picked up by the NGO`,
            type: "FOOD_PICKED_UP",
            io: req.app.get("io")
        });

        return res.status(200).json({
            success: true,
            message: "Food marked as picked up",
            donation
        });

    } catch (error) {
        console.error("Pickup error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update pickup status"
        });
    }
};


// ============================================
// 4. COMPLETE FOOD DONATION
// ============================================

export const completeDonation = async (req, res) => {
    try {
        if (!checkVerifiedNgo(req, res)) return;

        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid donation ID"
            });
        }

        const now = new Date();

        const donation = await FoodDonation.findOneAndUpdate(
            {
                _id: id,
                ngo: req.user._id,
                status: "PICKED_UP"
            },
            {
                $set: {
                    status: "COMPLETED",
                    completedAt: now
                }
            },
            {
                new: true,
                runValidators: true
            }
        ).populate("donor", "name email phone");

        if (!donation) {
            return res.status(409).json({
                success: false,
                message: "Only picked-up donations can be completed"
            });
        }

        await sendDonationNotification({
            receiver: donation.donor._id,
            donation,
            message: `Your food donation ${donation.foodName} has been completed`,
            type: "DONATION_COMPLETED",
            io: req.app.get("io")
        });

        return res.status(200).json({
            success: true,
            message: "Donation completed successfully",
            donation
        });

    } catch (error) {
        console.error("Complete donation error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to complete donation"
        });
    }
};


// ============================================
// 5. UPDATE NGO PROFILE
// ============================================

export const updateNgoProfile = async (req, res) => {
    try {
        if (!checkVerifiedNgo(req, res)) return;

        const {
            organizationName,
            description,
            serviceRadiusKm,
            latitude,
            longitude
        } = req.body;

        const ngo = await User.findById(req.user._id);

        if (!ngo) {
            return res.status(404).json({
                success: false,
                message: "NGO not found"
            });
        }

        if (!ngo.ngoDetails) {
            ngo.ngoDetails = {};
        }

        // Update organization name

        if (organizationName !== undefined) {
            if (
                typeof organizationName !== "string" ||
                !organizationName.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid organization name"
                });
            }

            ngo.ngoDetails.organizationName =
                organizationName.trim();
        }

        // Update description

        if (description !== undefined) {
            if (typeof description !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid description"
                });
            }

            ngo.ngoDetails.description = description.trim();
        }

        // Update service radius

        if (serviceRadiusKm !== undefined) {
            const radius = Number(serviceRadiusKm);

            if (
                !Number.isFinite(radius) ||
                radius < 1 ||
                radius > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Service radius must be between 1 and 100 km"
                });
            }

            ngo.ngoDetails.serviceRadiusKm = radius;
        }

        // Update geographical location

        if (
            latitude !== undefined ||
            longitude !== undefined
        ) {
            const lat = Number(latitude);
            const lng = Number(longitude);

            if (
                latitude === undefined ||
                longitude === undefined ||
                !Number.isFinite(lat) ||
                !Number.isFinite(lng) ||
                lat < -90 ||
                lat > 90 ||
                lng < -180 ||
                lng > 180
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Provide valid latitude and longitude"
                });
            }

            ngo.location = {
                type: "Point",
                coordinates: [lng, lat]
            };
        }

        await ngo.save();

        return res.status(200).json({
            success: true,
            message: "NGO profile updated successfully",

            ngo: {
                id: ngo._id,
                name: ngo.name,
                email: ngo.email,
                phone: ngo.phone,
                address: ngo.address,
                ngoDetails: ngo.ngoDetails,
                location: ngo.location,
                isVerified: ngo.isVerified
            }
        });

    } catch (error) {
        console.error("Update NGO profile error:", error);

        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update NGO profile"
        });
    }
};
