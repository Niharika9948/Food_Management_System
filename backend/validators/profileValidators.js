
import { z } from "zod";

// Reusable number validation
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
            .min(min)
            .max(max)
    );


// Update profile validation
export const updateProfileSchema = z.object({
    body: z.object({

        name: z.string()
            .trim()
            .min(2, "Name must contain at least 2 characters")
            .max(100)
            .optional(),

        phone: z.string()
            .regex(
                /^[0-9]{10}$/,
                "Enter a valid 10-digit phone number"
            )
            .optional(),

        address: z.string()
            .trim()
            .min(5, "Address must contain at least 5 characters")
            .max(300)
            .optional(),

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


// Change password validation
export const changePasswordSchema = z.object({
    body: z.object({

        currentPassword: z.string()
            .min(1, "Current password is required")
            .max(100),

        newPassword: z.string()
            .min(8, "New password must contain at least 8 characters")
            .max(100, "Password is too long")

    }).strict(),

    query: z.object({}),
    params: z.object({})
});
