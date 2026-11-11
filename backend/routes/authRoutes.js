
import express from "express";

import { authLimiter } from "../middleware/securityMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
    registerUser,
    loginUser,
    getProfile
} from "../controllers/authController.js";

import {
    registerSchema,
    loginSchema
} from "../validators/authValidators.js";

const router = express.Router();

router.post(
    "/register",
    authLimiter,
    validate(registerSchema),
    registerUser
);

router.post(
    "/login",
    authLimiter,
    validate(loginSchema),
    loginUser
);

router.get("/profile", protect, getProfile);

export default router;
