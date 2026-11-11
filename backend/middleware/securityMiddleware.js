
import rateLimit from "express-rate-limit";

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes

    limit: 300,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    // Do not count successful requests as failed requests
    skipSuccessfulRequests: false,

    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});


// Authentication rate limiter
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes

    limit: 20,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many login or registration attempts. Please try again after 15 minutes."
    }
});
