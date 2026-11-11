
import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
    updateProfileSchema,
    changePasswordSchema
} from "../validators/profileValidators.js";

import {
    updateProfile,
    changePassword
} from "../controllers/profileController.js";

const router = express.Router();

// All profile routes require authentication
router.use(protect);

// Update user profile
router.put(
    "/update",
    validate(updateProfileSchema),
    updateProfile
);

// Change account password
router.patch(
    "/change-password",
    validate(changePasswordSchema),
    changePassword
);

export default router;
