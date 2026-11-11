import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";


// ===============================
// USER REGISTRATION
// ===============================

export const registerUser = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            phone,
            role,
            address,
            latitude,
            longitude,
            organizationName,
            registrationNumber
        } = req.body;


        // Check required fields

        if (!name || !email || !password || !phone || !role) {

            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });

        }


        // Validate role

        if (!["donor", "ngo"].includes(role)) {

            return res.status(400).json({
                success: false,
                message: "Invalid role. Admin registration is not public."
            });

        }


        // Validate password

        if (password.length < 8) {

            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });

        }


        // Validate email

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {

            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });

        }


        // Check existing user

        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });

        }


        // Validate phone

        if (!/^\d{10}$/.test(phone)) {

            return res.status(400).json({
                success: false,
                message: "Phone number must contain 10 digits"
            });

        }


        // Validate NGO details

        if (role === "ngo" && (!organizationName || !registrationNumber)) {

            return res.status(400).json({
                success: false,
                message: "NGO name and registration number are required"
            });

        }


        // Validate location if supplied

        const hasLatitude = latitude !== undefined && latitude !== "";
        const hasLongitude = longitude !== undefined && longitude !== "";

        if (
            hasLatitude !== hasLongitude ||
            (hasLatitude && (
                !Number.isFinite(Number(latitude)) ||
                !Number.isFinite(Number(longitude)) ||
                Number(latitude) < -90 ||
                Number(latitude) > 90 ||
                Number(longitude) < -180 ||
                Number(longitude) > 180
            ))
        ) {

            return res.status(400).json({
                success: false,
                message: "Please provide valid latitude and longitude"
            });

        }


        // Encrypt password

        const hashedPassword = await bcrypt.hash(password, 12);


        // Create user

        const userData = {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone,
            role,
            address: address || ""
        };


        // Save location only when coordinates are supplied

        if (hasLatitude && hasLongitude) {

            userData.location = {
                type: "Point",
                coordinates: [
                    Number(longitude),
                    Number(latitude)
                ]
            };

        }


        // Save NGO information

        if (role === "ngo") {

            userData.ngoDetails = {
                organizationName,
                registrationNumber
            };

        }


        const user = await User.create(userData);


        // Generate JWT

        const token = generateToken(user);


        return res.status(201).json({

            success: true,

            message: "Registration successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isVerified: user.isVerified
            }

        });

    } catch (error) {

        console.error("Registration Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });

    }

};


// ===============================
// USER LOGIN
// ===============================

export const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;


        // Check fields

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });

        }


        // Find user and password

        const user = await User.findOne({
            email: email.toLowerCase()
        }).select("+password");


        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }


        // Check active account

        if (!user.isActive) {

            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });

        }


        // Compare password

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );


        if (!isMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }


        // Generate token

        const token = generateToken(user);


        return res.status(200).json({

            success: true,

            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isVerified: user.isVerified
            }

        });

    } catch (error) {

        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });

    }

};


// ===============================
// GET USER PROFILE
// ===============================

export const getProfile = async (req, res) => {

    try {

        const user = req.user;

        return res.status(200).json({

            success: true,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                address: user.address,
                location: user.location,
                isVerified: user.isVerified
            }

        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Unable to fetch profile"
        });

    }

};