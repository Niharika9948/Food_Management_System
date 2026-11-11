import { createNotification } from "../services/notificationService.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// ============================================
// 1. UPDATE USER PROFILE
// ============================================

export const updateProfile = async (req, res) => {
    try {
        const {
            name,
            phone,
            address,
            latitude,
            longitude
        } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update name

        if (name !== undefined) {
            if (
                typeof name !== "string" ||
                name.trim().length < 2 ||
                name.trim().length > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Name must contain 2 to 100 characters"
                });
            }

            user.name = name.trim();
        }

        // Update phone

        if (phone !== undefined) {
            const phoneNumber = String(phone).trim();

            if (!/^[0-9]{10}$/.test(phoneNumber)) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid 10-digit phone number"
                });
            }

            user.phone = phoneNumber;
        }

        // Update address

        if (address !== undefined) {
            if (
                typeof address !== "string" ||
                address.trim().length < 5 ||
                address.trim().length > 300
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Address must contain 5 to 300 characters"
                });
            }

            user.address = address.trim();
        }

        // Update location

        if (
            latitude !== undefined ||
            longitude !== undefined
        ) {
            const lat = Number(latitude);
            const lng = Number(longitude);

            if (
                latitude === undefined ||
                longitude === undefined ||
                latitude === null ||
                longitude === null ||
                latitude === "" ||
                longitude === "" ||
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

            user.location = {
                type: "Point",
                coordinates: [lng, lat]
            };
        }

        await user.save();
        try {
    await createNotification({
        receiver: user._id,
        message: "Your profile has been updated successfully.",
        type: "PROFILE_UPDATED",
        io: req.app.get("io")
    });
} catch (notificationError) {
    console.error(
        "Profile notification error:",
        notificationError.message
    );
}
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                location: user.location,
                isVerified: user.isVerified,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error("Update profile error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update profile"
        });
    }
};


// ============================================
// 2. CHANGE PASSWORD
// ============================================

export const changePassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body;

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        if (newPassword.length < 8 || newPassword.length > 100) {
            return res.status(400).json({
                success: false,
                message: "New password must contain 8 to 100 characters"
            });
        }

        // Load password explicitly because
        // password is hidden by default in User model.

        const user = await User.findById(req.user._id)
            .select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Verify current password

        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Prevent reusing the current password

        const isSamePassword = await bcrypt.compare(
            newPassword,
            user.password
        );

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password"
            });
        }

        // Hash new password

        user.password = await bcrypt.hash(
            newPassword,
            12
        );

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully. Please log in again."
        });

    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to change password"
        });
    }
};
