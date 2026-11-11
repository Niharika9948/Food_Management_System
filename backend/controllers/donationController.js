
import FoodDonation from "../models/FoodDonation.js";
import { notifyNearbyNgos } from "../services/matchingService.js";
import cloudinary, {
    isCloudinaryConfigured
} from "../config/cloudinary.js";
import { Readable } from "stream";

const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "food_management/donations",
                resource_type: "image"
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
        );

        Readable.from(file.buffer).pipe(uploadStream);
    });
};

const uploadDonationImages = async (files = []) => {
    if (!isCloudinaryConfigured) {
    throw new Error(
        "Cloudinary is not configured. Please check your backend .env file"
    );
}
    if (!files.length) {
        return [];
    }

    const uploadedImages = [];

    try {
        for (const file of files) {
            const image = await uploadToCloudinary(file);
            uploadedImages.push(image);
        }

        return uploadedImages;
    } catch (error) {
        await deleteCloudinaryImages(uploadedImages);
        throw error;
    }
};

const deleteCloudinaryImages = async (images = []) => {
    for (const image of images) {
        if (!image?.publicId) {
            continue;
        }

        try {
            await cloudinary.uploader.destroy(image.publicId);
        } catch (error) {
            console.error(
                "Cloudinary image cleanup error:",
                error.message
            );
        }
    }
};

const isValidLocation = (latitude, longitude) => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    return (
        Number.isFinite(lat) &&
        lat >= -90 &&
        lat <= 90 &&
        Number.isFinite(lng) &&
        lng >= -180 &&
        lng <= 180
    );
};

// 1. CREATE FOOD DONATION

export const createDonation = async (req, res) => {
    let uploadedImages = [];

    try {
        if (req.user.role !== "donor") {
            return res.status(403).json({
                success: false,
                message: "Only donors can create food donations"
            });
        }

        const {
            foodName,
            category,
            quantity,
            unit,
            description,
            imageUrl,
            preparationTime,
            expiryTime,
            collectionDeadline,
            address,
            latitude,
            longitude,
            storageInstructions,
            allergens,
            dietaryTags,
            storageTemperature,
            pickupInstructions,
            preferredPickupTime
        } = req.body;

        if (
            !foodName ||
            !category ||
            quantity === undefined ||
            !unit ||
            !preparationTime ||
            !expiryTime ||
            !collectionDeadline ||
            !address ||
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required donation details"
            });
        }

        const qty = Number(quantity);

        if (!Number.isFinite(qty) || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than zero"
            });
        }

        if (!isValidLocation(latitude, longitude)) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid latitude and longitude"
            });
        }

        const prepared = new Date(preparationTime);
        const expiry = new Date(expiryTime);
        const deadline = new Date(collectionDeadline);
        const now = new Date();

        if (
            Number.isNaN(prepared.getTime()) ||
            Number.isNaN(expiry.getTime()) ||
            Number.isNaN(deadline.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid date and time values"
            });
        }

        if (
            expiry <= now ||
            expiry <= prepared ||
            deadline <= now ||
            deadline > expiry ||
            deadline < prepared
        ) {
            return res.status(400).json({
                success: false,
                message: "Check preparation, collection deadline and expiry times"
            });
        }

        if (req.files?.length > 5) {
            return res.status(400).json({
                success: false,
                message: "You can upload a maximum of 5 photos"
            });
        }

        uploadedImages = await uploadDonationImages(req.files || []);

        const donation = await FoodDonation.create({
            donor: req.user._id,
            foodName: foodName.trim(),
            category,
            quantity: qty,
            unit,
            description,
            imageUrl: uploadedImages[0]?.url || imageUrl,
            images: uploadedImages,
            preparationTime: prepared,
            expiryTime: expiry,
            collectionDeadline: deadline,
            address: address.trim(),
            location: {
                type: "Point",
                coordinates: [
                    Number(longitude),
                    Number(latitude)
                ]
            },
            storageInstructions,
            allergens,
            dietaryTags,
            storageTemperature,
            pickupInstructions,
            preferredPickupTime
        });

        let notifiedNgos = 0;

        try {
            notifiedNgos = await notifyNearbyNgos(
                donation,
                req.app.get("io")
            );
        } catch (notificationError) {
            console.error(
                "NGO notification error:",
                notificationError
            );
        }

        return res.status(201).json({
            success: true,
            message: "Food donation created successfully",
            notifiedNgos,
            donation
        });

    } catch (error) {
        console.error("Create donation error:", error);

        await deleteCloudinaryImages(uploadedImages);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Duplicate donation data"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create food donation"
        });
    }
};

// 2. GET DONOR'S OWN DONATIONS

export const getMyDonations = async (req, res) => {
    try {
        if (req.user.role !== "donor") {
            return res.status(403).json({
                success: false,
                message: "Only donors can view their donations"
            });
        }

        const donations = await FoodDonation.find({
            donor: req.user._id
        })
            .populate("ngo", "name email phone")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: donations.length,
            donations
        });

    } catch (error) {
        console.error("Get my donations error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch your donations"
        });
    }
};

// 3. GET AVAILABLE DONATIONS FOR VERIFIED NGOs

export const getAvailableDonations = async (req, res) => {
    try {
        if (
            req.user.role !== "ngo" ||
            !req.user.isVerified
        ) {
            return res.status(403).json({
                success: false,
                message: "Only verified NGOs can view available donations"
            });
        }

        const now = new Date();

        const donations = await FoodDonation.find({
            status: "AVAILABLE",
            collectionDeadline: { $gt: now },
            expiryTime: { $gt: now }
        })
            .populate("donor", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: donations.length,
            donations
        });

    } catch (error) {
        console.error("Available donations error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch available donations"
        });
    }
};

// 4. GET DONATION BY ID

export const getDonationById = async (req, res) => {
    try {
        const donation = await FoodDonation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        const isDonor = donation.donor.equals(req.user._id);

        const isAssignedNgo =
            donation.ngo &&
            donation.ngo.equals(req.user._id);

        const isVerifiedNgo =
            req.user.role === "ngo" &&
            req.user.isVerified;

        if (
            !isDonor &&
            !isAssignedNgo &&
            !(isVerifiedNgo && donation.status === "AVAILABLE")
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot view this donation"
            });
        }

        const donorFields =
            isDonor || isAssignedNgo
                ? "name email phone"
                : "name";

        await donation.populate([
            {
                path: "donor",
                select: donorFields
            },
            {
                path: "ngo",
                select: "name email phone"
            }
        ]);

        return res.status(200).json({
            success: true,
            donation
        });

    } catch (error) {
        console.error("Get donation error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch donation"
        });
    }
};

// 5. UPDATE DONATION

export const updateDonation = async (req, res) => {
    let uploadedImages = [];

    try {
        const donation = await FoodDonation.findOne({
            _id: req.params.id,
            donor: req.user._id
        });

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        if (donation.status !== "AVAILABLE") {
            return res.status(400).json({
                success: false,
                message: "Only available donations can be updated"
            });
        }

        const allowedFields = [
            "foodName",
            "category",
            "quantity",
            "unit",
            "description",
            "imageUrl",
            "preparationTime",
            "expiryTime",
            "collectionDeadline",
            "address",
            "storageInstructions",
            "allergens",
            "dietaryTags",
            "storageTemperature",
            "pickupInstructions",
            "preferredPickupTime"
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                donation[field] = req.body[field];
            }
        }

        if (
            req.body.latitude !== undefined ||
            req.body.longitude !== undefined
        ) {
            if (
                req.body.latitude === undefined ||
                req.body.longitude === undefined ||
                !isValidLocation(
                    req.body.latitude,
                    req.body.longitude
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Provide valid latitude and longitude together"
                });
            }

            donation.location = {
                type: "Point",
                coordinates: [
                    Number(req.body.longitude),
                    Number(req.body.latitude)
                ]
            };
        }

        if (
            !Number.isFinite(Number(donation.quantity)) ||
            Number(donation.quantity) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than zero"
            });
        }

        const prepared = new Date(donation.preparationTime);
        const expiry = new Date(donation.expiryTime);
        const deadline = new Date(donation.collectionDeadline);
        const now = new Date();

        if (
            Number.isNaN(prepared.getTime()) ||
            Number.isNaN(expiry.getTime()) ||
            Number.isNaN(deadline.getTime()) ||
            expiry <= now ||
            deadline <= now ||
            deadline > expiry ||
            expiry <= prepared ||
            deadline < prepared
        ) {
            return res.status(400).json({
                success: false,
                message: "Please check the donation dates and deadlines"
            });
        }

        if (
            req.body.foodName !== undefined &&
            !donation.foodName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Food name cannot be empty"
            });
        }

        if (
            req.body.address !== undefined &&
            !donation.address.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Address cannot be empty"
            });
        }

        const oldImages = donation.images?.map((image) => ({
            publicId: image.publicId
        })) || [];

        if (req.files?.length) {
            if (req.files.length > 5) {
                return res.status(400).json({
                    success: false,
                    message: "You can upload a maximum of 5 photos"
                });
            }

            uploadedImages = await uploadDonationImages(req.files);

            donation.images = uploadedImages;
            donation.imageUrl = uploadedImages[0].url;
        }

        await donation.save();

        if (uploadedImages.length) {
            await deleteCloudinaryImages(oldImages);
        }

        const notifiedNgos = await notifyNearbyNgos(
            donation,
            req.app.get("io"),
            {
                type: "DONATION_UPDATED",
                message: `Food donation "${donation.foodName}" has been updated by the donor. Please check the latest details.`
            }
        );

        return res.status(200).json({
            success: true,
            message: "Donation updated successfully",
            notifiedNgos,
            donation
        });

    } catch (error) {
        console.error("Update donation error:", error);

        await deleteCloudinaryImages(uploadedImages);

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
            message: "Unable to update donation"
        });
    }
};


// 6. CANCEL DONATION


export const cancelDonation = async (req, res) => {
    try {
        const donation = await FoodDonation.findOne({
            _id: req.params.id,
            donor: req.user._id
        });

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        if (donation.status !== "AVAILABLE") {
            return res.status(400).json({
                success: false,
                message: "Only available donations can be cancelled"
            });
        }

        donation.status = "CANCELLED";

        await donation.save();

        const notifiedNgos = await notifyNearbyNgos(
            donation,
            req.app.get("io"),
            {
                type: "DONATION_CANCELLED",
                message: `Food donation "${donation.foodName}" has been cancelled by the donor.`
            }
        );

        return res.status(200).json({
            success: true,
            message: "Donation cancelled successfully",
            notifiedNgos,
            donation
        });

    } catch (error) {
        console.error("Cancel donation error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to cancel donation"
        });
    }
};


// 7. SEARCH AND FILTER DONATIONS

export const searchDonations = async (req, res) => {
    try {
        if (
            req.user.role !== "ngo" ||
            !req.user.isVerified
        ) {
            return res.status(403).json({
                success: false,
                message: "Only verified NGOs can search donations"
            });
        }

        const {
            search = "",
            category,
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

        const now = new Date();

        const filter = {
            status: "AVAILABLE",
            expiryTime: { $gt: now },
            collectionDeadline: { $gt: now }
        };

        if (search.trim()) {
            const safeSearch = search.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.foodName = {
                $regex: safeSearch,
                $options: "i"
            };
        }

        if (category && category.trim()) {
            filter.category = category.trim();
        }

        const totalDonations =
            await FoodDonation.countDocuments(filter);

        const donations = await FoodDonation.find(filter)
            .populate("donor", "name")
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize);

        return res.status(200).json({
            success: true,
            message: "Donations retrieved successfully",
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
        console.error("Search donations error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to search donations"
        });
    }
};
