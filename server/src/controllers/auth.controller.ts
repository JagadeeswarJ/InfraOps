
import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env.config.js"
import { db } from "../config/db.config.js";
import { User, UserRole, OTP } from "../utils/types.js";
import { FieldValue } from "firebase-admin/firestore";
import { generateOTP, sendOTPEmail } from "../utils/email.util.js";

const onBoarding = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            name,
            email,
            password,
            phone,
            role,
            expertise,
            communityId,
        } = req.body;
        console.log(name, email, password, phone, role, expertise, communityId);
        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                error: "Missing required fields: name, email, password, role"
            });
        }

        // Validate role
        const validRoles: UserRole[] = ['resident', 'technician', 'manager'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                error: "Invalid role. Must be one of: resident, technician, manager"
            });
        }

        // Validate expertise for technicians
        if (role === 'technician' && (!expertise || expertise.length === 0)) {
            return res.status(400).json({
                error: "Expertise is required for technicians"
            });
        }

        // Check if user already exists by email
        const existingUserQuery = await db.collection('users').where('email', '==', email).get();
        if (!existingUserQuery.empty) {
            return res.status(409).json({
                error: "User with this email already exists"
            });
        }

        // Generate OTP and expiration time (10 minutes)
        const otp = generateOTP();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // Store user data temporarily with OTP
        const otpData: OTP = {
            email,
            otp,
            userData: {
                name,
                email,
                password: password, // Store plain text password
                phone: phone || undefined,
                role,
                expertise: role === 'technician' ? expertise : undefined,
                communityId: communityId || undefined,
            },
            expiresAt: FieldValue.serverTimestamp() as any,
            createdAt: FieldValue.serverTimestamp() as any
        };

        // Save OTP to Firestore
        await db.collection('otps').add(otpData);

        // Send OTP email
        await sendOTPEmail(email, name, otp);

        return res.status(200).json({
            success: true,
            message: "OTP sent to your email. Please verify to complete registration.",
            email: email
        });

    } catch (error) {
        console.error("Onboarding error:", error);
        return res.status(500).json({
            error: "Internal server error during onboarding"
        });
    }
};

const login = async (req: Request, res: Response): Promise<any> => {
    console.log("Login function called");
    try {
        console.log("hello")
        const { email, password } = req.body;
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: "Missing required fields: email, password"
            });
        }
        console.log(email,password)
        console.log("Database instance:", db ? "Connected" : "Not connected");
        
        // Find user by email
        console.log("Querying users collection for email:", email);
        const userQuery = await db.collection('users').where('email', '==', email).get();
        
        if (userQuery.empty) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        // Get the first (and should be only) user document
        const userDoc = userQuery.docs[0];
        const userData = userDoc.data() as User;
        console.log(userData)
        // Verify password using plain text comparison
        if (userData.password !== password) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        // Generate JWT token
        const payload = {
            userId: userDoc.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            communityId: userData.communityId,
            expertise: userData.expertise
        };
        const secret = env.JWT_SECRET as string;
        const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as StringValue };
        const token = jwt.sign(payload, secret, options);

        // Return user data with document ID (without password)
        const responseUser = {
            id: userDoc.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            communityId: userData.communityId
        };

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: responseUser,
            token
        });

    } catch (error) {
        console.error("Login error:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        console.error("Error message:", error instanceof Error ? error.message : 'Unknown error');
        return res.status(500).json({
            error: "Internal server error during login",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

const verifyOTP = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, otp } = req.body;

        // Validate required fields
        if (!email || !otp) {
            return res.status(400).json({
                error: "Missing required fields: email, otp"
            });
        }

        // Find OTP record
        const otpQuery = await db.collection('otps')
            .where('email', '==', email)
            .where('otp', '==', otp)
            .get();

        if (otpQuery.empty) {
            return res.status(401).json({
                error: "Invalid or expired OTP"
            });
        }

        const otpDoc = otpQuery.docs[0];
        const otpData = otpDoc.data() as OTP;

        // Check if OTP is expired (10 minutes)
        const now = new Date();
        const createdAt = otpData.createdAt.toDate();
        const timeDiff = now.getTime() - createdAt.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        if (minutesDiff > 10) {
            // Delete expired OTP
            await db.collection('otps').doc(otpDoc.id).delete();
            return res.status(401).json({
                error: "OTP has expired. Please request a new one."
            });
        }

        // Create user with the stored data
        const newUser: User = {
            ...otpData.userData,
            createdAt: FieldValue.serverTimestamp() as any
        };

        // Save user to Firestore
        const userRef = await db.collection('users').add(newUser);

        // Delete the OTP record
        await db.collection('otps').doc(otpDoc.id).delete();

        // Generate JWT token for automatic login
        const payload = {
            userId: userRef.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            communityId: newUser.communityId,
            expertise: newUser.expertise
        };
        const secret = env.JWT_SECRET as string;
        const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as StringValue };
        const token = jwt.sign(payload, secret, options);

        // Return success response with user data and token
        const responseUser = {
            id: userRef.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            communityId: newUser.communityId
        };

        return res.status(201).json({
            success: true,
            message: "Email verified and user registered successfully",
            user: responseUser,
            token
        });

    } catch (error) {
        console.error("OTP verification error:", error);
        return res.status(500).json({
            error: "Internal server error during OTP verification"
        });
    }
};

export {
    onBoarding,
    login,
    verifyOTP
}