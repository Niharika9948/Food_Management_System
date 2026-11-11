
import mongoose from "mongoose";
import User from "../models/User.js";
import FoodDonation from "../models/FoodDonation.js";
import { createNotification } from "../services/notificationService.js";

// ============================================
// SAFE NOTIFICATION HELPER
// ============================================


const sendAdminNotification = async ({
    receiver,
    message,
    type = "GENERAL",
    io
}) => {
    try {
        await createNotification({
            receiver,
            message,
            type,
            io
        });
    } catch (error) {
        console.error("Admin notification error:", error.message);
    }
};



// ============================================
// 1. GET PENDING NGO REGISTRATIONS
// ============================================

export const getPendingNgos = async (req, res) => {
    try {
        const ngos = await User.find({
            role: "ngo",
            isVerified: false
        })
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: ngos.length,
            ngos
        });

    } catch (error) {
        console.error("Get pending NGOs error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch pending NGOs"
        });
    }
};


// ============================================
// 2. VERIFY NGO
// ============================================

export const verifyNgo = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid NGO ID"
            });
        }

        const ngo = await User.findOneAndUpdate(
            {
                _id: id,
                role: "ngo",
                isVerified: false
            },
            {
                $set: {
                    isVerified: true
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!ngo) {
            const existingNgo = await User.findOne({
                _id: id,
                role: "ngo"
            });

            if (!existingNgo) {
                return res.status(404).json({
                    success: false,
                    message: "NGO not found"
                });
            }

            return res.status(409).json({
                success: false,
                message: "NGO is already verified"
            });
        }

        await sendAdminNotification({
    receiver: ngo._id,
    message: "Congratulations! Your NGO registration has been approved by the administrator. You can now access NGO features.",
    type: "NGO_VERIFICATION",
    io: req.app.get("io")
});

        return res.status(200).json({
            success: true,
            message: "NGO verified successfully",
            ngo: {
                id: ngo._id,
                name: ngo.name,
                email: ngo.email,
                isVerified: ngo.isVerified
            }
        });

    } catch (error) {
        console.error("Verify NGO error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify NGO"
        });
    }
};


// ============================================
// 3. GET ALL USERS
// ============================================

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error("Get all users error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch users"
        });
    }
};


// ============================================
// 4. ACTIVATE OR DEACTIVATE USER
// ============================================

export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive must be true or false"
            });
        }

        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own account status"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin account status cannot be changed here"
            });
        }

        user.isActive = isActive;

        await user.save();

        return res.status(200).json({
            success: true,
            message: `User ${isActive ? "activated" : "deactivated"} successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error("Update user status error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update user status"
        });
    }
};


// ============================================
// 5. GET ADMIN DASHBOARD STATISTICS
// ============================================

export const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalDonors,
            totalNgos,
            verifiedNgos,
            pendingNgos,
            totalDonations,
            availableDonations,
            acceptedDonations,
            pickedUpDonations,
            completedDonations,
            expiredDonations,
            cancelledDonations
        ] = await Promise.all([

            User.countDocuments(),

            User.countDocuments({
                role: "donor"
            }),

            User.countDocuments({
                role: "ngo"
            }),

            User.countDocuments({
                role: "ngo",
                isVerified: true
            }),

            User.countDocuments({
                role: "ngo",
                isVerified: false
            }),

            FoodDonation.countDocuments(),

            FoodDonation.countDocuments({
                status: "AVAILABLE"
            }),

            FoodDonation.countDocuments({
                status: "ACCEPTED"
            }),

            FoodDonation.countDocuments({
                status: "PICKED_UP"
            }),

            FoodDonation.countDocuments({
                status: "COMPLETED"
            }),

            FoodDonation.countDocuments({
                status: "EXPIRED"
            }),

            FoodDonation.countDocuments({
                status: "CANCELLED"
            })
        ]);

        return res.status(200).json({
            success: true,

            stats: {
                users: {
                    total: totalUsers,
                    donors: totalDonors,
                    ngos: totalNgos,
                    verifiedNgos,
                    pendingNgos
                },

                donations: {
                    total: totalDonations,
                    available: availableDonations,
                    accepted: acceptedDonations,
                    pickedUp: pickedUpDonations,
                    completed: completedDonations,
                    expired: expiredDonations,
                    cancelled: cancelledDonations
                }
            }
        });

    } catch (error) {
        console.error("Dashboard statistics error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch dashboard statistics"
        });
    }
};


// ============================================
// 6. GET ALL DONATIONS WITH PAGINATION
// ============================================

export const getAllDonations = async (req, res) => {
    try {
        const {
            status,
            page = 1,
            limit = 10
        } = req.query;

        const currentPage = Math.max(
            1,
            parseInt(page, 10) || 1
        );

        const pageSize = Math.min(
            50,
            Math.max(1, parseInt(limit, 10) || 10)
        );

        const filter = {};

        const allowedStatuses = [
            "AVAILABLE",
            "ACCEPTED",
            "PICKED_UP",
            "COMPLETED",
            "EXPIRED",
            "CANCELLED"
        ];

        if (status) {
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid donation status"
                });
            }

            filter.status = status;
        }

        const totalDonations =
            await FoodDonation.countDocuments(filter);

        const donations = await FoodDonation.find(filter)
            .populate("donor", "name email phone")
            .populate("ngo", "name email")
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize);

        return res.status(200).json({
            success: true,

            pagination: {
                totalDonations,
                currentPage,
                totalPages: Math.ceil(
                    totalDonations / pageSize
                ),
                pageSize
            },

            donations
        });

    } catch (error) {
        console.error("Get all donations error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch donations"
        });
    }
};
