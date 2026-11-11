
import { z } from "zod";

// Validate MongoDB ID
const mongoIdSchema = z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ID"
);


// Validate admin operations that require an ID
export const adminIdSchema = z.object({
    body: z.object({}).strict(),
    query: z.object({}),
    params: z.object({
        id: mongoIdSchema
    })
});


// Validate user activation/deactivation
export const updateUserStatusSchema = z.object({
    body: z.object({
        isActive: z.boolean()
    }).strict(),

    query: z.object({}),

    params: z.object({
        id: mongoIdSchema
    })
});
