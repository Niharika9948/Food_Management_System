
import express from "express";

import {
    protect,
    authorize
} from "../middleware/authMiddleware.js";

import { validate } from "../middleware/validate.js";

import {
    adminIdSchema,
    updateUserStatusSchema
} from "../validators/adminValidators.js";

import {
    getPendingNgos,
    verifyNgo,
    getAllUsers,
    updateUserStatus,
    getDashboardStats,
    getAllDonations
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require admin authentication
router.use(protect);
router.use(authorize("admin"));

// Admin dashboard
router.get("/dashboard", getDashboardStats);

// View NGOs waiting for verification
router.get("/ngos/pending", getPendingNgos);

// Verify an NGO
router.patch(
    "/ngos/:id/verify",
    validate(adminIdSchema),
    verifyNgo
);

// View all users
router.get("/users", getAllUsers);

// Activate or deactivate a user
router.patch(
    "/users/:id/status",
    validate(updateUserStatusSchema),
    updateUserStatus
);

// View all food donations
router.get("/donations", getAllDonations);

export default router;
