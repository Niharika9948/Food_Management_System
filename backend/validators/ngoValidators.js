
import { z } from "zod";

// Reusable number validator
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


// NGO profile update validation
export const updateNgoProfileSchema = z.object({
    body: z.object({

        organizationName: z.string()
            .trim()
            .min(2, "Organization name must contain at least 2 characters")
            .max(150)
            .optional(),

        description: z.string()
            .trim()
            .max(1000)
            .optional(),

        serviceRadiusKm: numberField(1, 100).optional(),

        latitude: numberField(-90, 90).optional(),

        longitude: numberField(-180, 180).optional()

    })
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
    params: z.object({})
});


// Donation ID validation
export const donationIdSchema = z.object({
    body: z.object({}),
    query: z.object({}),

    params: z.object({
        id: z.string().regex(
            /^[0-9a-fA-F]{24}$/,
            "Invalid donation ID"
        )
    })
});
