
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import User from "./models/User.js";

import authRoutes from "./routes/authRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import ngoRoutes from "./routes/ngoRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

import { startExpiryJob } from "./jobs/expiryJob.js";
import { startReminderJob } from "./jobs/reminderJob.js";

import { apiLimiter } from "./middleware/securityMiddleware.js";

import {
    notFound,
    errorHandler
} from "./middleware/errorMiddleware.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const CLIENT_URL =
    process.env.CLIENT_URL || "http://localhost:5173";

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in .env");
}

if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in .env");
}

const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
    CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(
            new Error(`CORS blocked for origin: ${origin}`)
        );
    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ]
};

app.use(cors(corsOptions));
app.use(helmet());

app.use(express.json({
    limit: "1mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "1mb"
}));

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.set("io", io);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Food Management System backend is running"
    });
});

app.get("/api/health", (req, res) => {
    const databaseConnected =
        User.db.readyState === 1;

    res.status(databaseConnected ? 200 : 503).json({
        success: databaseConnected,
        message: "Food Management System API status",

        database: databaseConnected
            ? "Connected"
            : "Disconnected",

        cloudinary: cloudinaryConfigured
            ? "Configured"
            : "Not configured",

        server: "Running"
    });
});

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/ngo", ngoRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(
                new Error("Authentication required")
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return next(
                new Error("Invalid or inactive user")
            );
        }

        socket.userId = user._id.toString();

        return next();

    } catch (error) {
        return next(
            new Error("Invalid or expired token")
        );
    }
});

io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);

    console.log(`User connected: ${socket.userId}`);

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.userId}`);
    });
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
    try {
        await connectDB();

        startExpiryJob(io);
        startReminderJob(io);

        httpServer.listen(PORT, () => {
            console.log("--------------------------------");
            console.log("Food Management System Backend");
            console.log(`Server: http://localhost:${PORT}`);
            console.log(`Frontend: ${CLIENT_URL}`);
            console.log("MongoDB connected successfully");
            console.log("Socket.IO initialized");
            console.log("Food expiry job started");
            console.log("Collection reminder job started");

            console.log(
                cloudinaryConfigured
                    ? "Cloudinary configured successfully"
                    : "Cloudinary credentials not configured"
            );

            console.log("--------------------------------");
        });

    } catch (error) {
        console.error(
            "Server startup error:",
            error.message
        );

        process.exit(1);
    }
};

startServer();
