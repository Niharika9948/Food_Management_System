
import express from "express";

import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { uploadFoodImages } from "../middleware/uploadMiddleware.js";

import {
    createDonationSchema,
    updateDonationSchema
} from "../validators/donationValidators.js";

import { donationIdSchema } from "../validators/ngoValidators.js";

import {
    createDonation,
    getMyDonations,
    getAvailableDonations,
    getDonationById,
    updateDonation,
    cancelDonation,
    searchDonations
} from "../controllers/donationController.js";

const router = express.Router();

router.use(protect);

// Donor creates a food donation with photos
router.post(
    "/",
    authorize("donor"),
    uploadFoodImages,
    validate(createDonationSchema),
    createDonation
);

// Donor views their own donations
router.get(
    "/my",
    authorize("donor"),
    getMyDonations
);

// Verified NGO views available donations
router.get(
    "/available",
    authorize("ngo"),
    getAvailableDonations
);

// NGO searches available donations
router.get(
    "/search",
    authorize("ngo"),
    searchDonations
);

// Donor updates a donation and can replace photos
router.put(
    "/:id",
    authorize("donor"),
    uploadFoodImages,
    validate(donationIdSchema),
    validate(updateDonationSchema),
    updateDonation
);

// Donor cancels a donation
router.patch(
    "/:id/cancel",
    authorize("donor"),
    validate(donationIdSchema),
    cancelDonation
);

// View a particular donation
router.get(
    "/:id",
    validate(donationIdSchema),
    getDonationById
);

export default router;
