
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        // Check JWT configuration
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Authentication configuration error"
            });
        }

        // Get authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !/^Bearer\s+\S+$/i.test(authHeader)) {
            return res.status(401).json({
                success: false,
                message: "Please login to access this resource"
            });
        }

        // Extract token
        const token = authHeader.replace(/^Bearer\s+/i, "");

        let decoded;

        // Verify token
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        // Check token payload
        if (!decoded || !decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }

        // Find active user
        const user = await User.findById(decoded.id).select("-password");

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "User not found or account inactive"
            });
        }

        // Attach authenticated user
        req.user = user;

        next();

    } catch (error) {
        next(error);
    }
};


// Role-based access control
export const authorize = (...roles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Please login first"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource"
            });
        }

        next();
    };
};
