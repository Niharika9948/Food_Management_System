
import express from "express";

import {
    protect,
    authorize
} from "../middleware/authMiddleware.js";

import { validate } from "../middleware/validate.js";

import {
    updateNgoProfileSchema,
    donationIdSchema
} from "../validators/ngoValidators.js";

import {
    acceptDonation,
    getMyAcceptedDonations,
    markDonationPickedUp,
    completeDonation,
    updateNgoProfile
} from "../controllers/ngoController.js";

const router = express.Router();

// All NGO routes require authentication
router.use(protect);

// Accept a food donation
router.patch(
    "/accept/:id",
    authorize("ngo"),
    validate(donationIdSchema),
    acceptDonation
);

// View donations accepted by this NGO
router.get(
    "/my-donations",
    authorize("ngo"),
    getMyAcceptedDonations
);

// Mark food as picked up
router.patch(
    "/pickup/:id",
    authorize("ngo"),
    validate(donationIdSchema),
    markDonationPickedUp
);

// Complete a donation
router.patch(
    "/complete/:id",
    authorize("ngo"),
    validate(donationIdSchema),
    completeDonation
);

// Update NGO profile and service radius
router.put(
    "/profile",
    authorize("ngo"),
    validate(updateNgoProfileSchema),
    updateNgoProfile
);

export default router;
