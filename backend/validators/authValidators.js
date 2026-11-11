
import { z } from "zod";

const registerBodySchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Name must contain at least 2 characters")
        .max(100, "Name cannot exceed 100 characters"),

    email: z.string()
        .trim()
        .email("Enter a valid email")
        .max(254, "Email is too long")
        .transform((value) => value.toLowerCase()),

    password: z.string()
        .min(8, "Password must contain at least 8 characters")
        .max(100, "Password is too long"),

    phone: z.string()
        .regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number"),

    address: z.string()
        .trim()
        .min(5, "Enter a valid address")
        .max(300, "Address cannot exceed 300 characters"),

    role: z.enum(["donor", "ngo"]).optional(),

    organizationName: z.string()
        .trim()
        .min(2, "Organization name must contain at least 2 characters")
        .max(150, "Organization name is too long")
        .optional(),

    registrationNumber: z.string()
        .trim()
        .min(3, "Enter a valid registration number")
        .max(100, "Registration number is too long")
        .optional()

}).strict().superRefine((data, ctx) => {
    if (data.role === "ngo") {
        if (!data.organizationName) {
            ctx.addIssue({
                code: "custom",
                path: ["organizationName"],
                message: "Organization name is required for NGO registration"
            });
        }

        if (!data.registrationNumber) {
            ctx.addIssue({
                code: "custom",
                path: ["registrationNumber"],
                message: "Registration number is required for NGO registration"
            });
        }
    }
});

export const registerSchema = z.object({
    body: registerBodySchema,
    query: z.object({}),
    params: z.object({})
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string()
            .trim()
            .email("Enter a valid email")
            .max(254, "Email is too long")
            .transform((value) => value.toLowerCase()),

        password: z.string()
            .min(1, "Password is required")
            .max(100, "Password is too long")
    }).strict(),

    query: z.object({}),
    params: z.object({})
});
