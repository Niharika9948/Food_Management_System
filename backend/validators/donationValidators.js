
import { z } from "zod";

const numberField = (min, max) =>
    z.preprocess(
        (value) => {
            if (
                value === null ||
                value === undefined ||
                value === "" ||
                (typeof value !== "number" && typeof value !== "string")
            ) {
                return NaN;
            }

            const number = Number(value);
            return Number.isFinite(number) ? number : NaN;
        },
        z.number()
            .finite("Enter a valid number")
            .min(min, `Minimum value is ${min}`)
            .max(max, `Maximum value is ${max}`)
    );

const dateField = z.string()
    .trim()
    .min(1, "Date is required")
    .refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "Enter a valid date and time"
    );

const parseArrayField = (value) => {
    if (typeof value !== "string") return value;

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const dietaryTagsField = z.preprocess(
    parseArrayField,
    z.array(
        z.enum([
            "Vegetarian",
            "Vegan",
            "Gluten-Free",
            "Dairy-Free",
            "Contains Nuts",
            "Egg-Free"
        ])
    ).max(6).optional()
);

const allergensField = z.preprocess(
    parseArrayField,
    z.array(
        z.string().trim().min(1).max(50)
    ).max(30).optional()
);
const donationFields = {
    foodName: z.string()
        .trim()
        .min(2, "Food name must contain at least 2 characters")
        .max(100),

    category: z.enum([
        "Vegetarian",
        "Non-Vegetarian",
        "Bakery",
        "Fruits",
        "Other"
    ]),

    quantity: numberField(1, 100000),

    unit: z.enum([
        "plates",
        "kg",
        "packets",
        "boxes"
    ]),

    description: z.string()
        .trim()
        .max(1000)
        .optional(),

    imageUrl: z.string()
        .trim()
        .max(2000)
        .optional(),

    preparationTime: dateField,

    expiryTime: dateField,

    collectionDeadline: dateField,

    address: z.string()
        .trim()
        .min(5, "Enter a valid pickup address")
        .max(300),

    latitude: numberField(-90, 90),

    longitude: numberField(-180, 180),

    storageInstructions: z.string()
        .trim()
        .max(1000)
        .optional(),

    allergens: allergensField,

    dietaryTags: dietaryTagsField,

    storageTemperature: z.string()
        .trim()
        .max(100)
        .optional(),

    pickupInstructions: z.string()
        .trim()
        .max(500)
        .optional(),

    preferredPickupTime: z.string()
        .trim()
        .max(100)
        .optional()
};

export const createDonationSchema = z.object({
    body: z.object({
        ...donationFields,
        images: z.any().optional()
    }).strict(),
    query: z.object({}),
    params: z.object({})
});

const updateFields = {
    foodName: donationFields.foodName.optional(),

    category: donationFields.category.optional(),

    quantity: donationFields.quantity.optional(),

    unit: donationFields.unit.optional(),

    description: donationFields.description,

    imageUrl: donationFields.imageUrl,

    preparationTime: dateField.optional(),

    expiryTime: dateField.optional(),

    collectionDeadline: dateField.optional(),

    address: donationFields.address.optional(),

    latitude: donationFields.latitude.optional(),

    longitude: donationFields.longitude.optional(),

    storageInstructions: donationFields.storageInstructions,

    allergens: donationFields.allergens,

    dietaryTags: donationFields.dietaryTags,

    storageTemperature: donationFields.storageTemperature,

    pickupInstructions: donationFields.pickupInstructions,

    preferredPickupTime: donationFields.preferredPickupTime
};

export const updateDonationSchema = z.object({
    body: z.object(updateFields)
        .strict()
        .refine(
            (data) => Object.keys(data).length > 0,
            {
                message: "Provide at least one field to update"
            }
        )
        .refine(
            (data) =>
                (data.latitude === undefined && data.longitude === undefined) ||
                (data.latitude !== undefined && data.longitude !== undefined),
            {
                message: "Latitude and longitude must be provided together"
            }
        ),

    query: z.object({}),

    params: z.object({
        id: z.string().regex(
            /^[0-9a-fA-F]{24}$/,
            "Invalid donation ID"
        )
    })
});
