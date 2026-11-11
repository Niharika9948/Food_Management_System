
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "./config/db.js";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
    try {
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE, ADMIN_ADDRESS } = process.env;

        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_PHONE || !ADMIN_ADDRESS) {
            throw new Error("Please provide all ADMIN details in the .env file");
        }

        if (ADMIN_PASSWORD.length < 8) {
            throw new Error("Admin password must contain at least 8 characters");
        }

        await connectDB();

        const existingAdmin = await User.findOne({
            email: ADMIN_EMAIL.toLowerCase()
        });

        if (existingAdmin) {
            throw new Error("An account with this email already exists. Use a different email.");
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

        const admin = await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL.toLowerCase(),
            password: hashedPassword,
            phone: ADMIN_PHONE,
            address: ADMIN_ADDRESS,
            role: "admin",
            isVerified: true,
            isActive: true
        });

        console.log("Admin account created successfully");
        console.log("Admin ID:", admin._id);
        console.log("Admin Email:", admin.email);
    } catch (error) {
        console.error("Admin creation error:", error.message);
        process.exitCode = 1;
    } finally {
        const mongoose = await import("mongoose");
        await mongoose.default.disconnect();
    }
};

createAdmin();
