import crypto from "crypto";
import User from "../models/user.model.js";
import OTP from "../models/otp.model.js";
import bcrypt from "bcrypt";
import { genToken, genOTPToken, getCookieOptions } from "../utils/auth.service.js";
import { sendOTPEmail } from "../utils/email.service.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterUser = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, collegeName, userType } = req.body;

    // Strict type checks against NoSQL injection
    if (typeof fullName !== "string" || !fullName.trim()) {
      const error = new Error("Full name is required and must be a valid string");
      error.statusCode = 400;
      return next(error);
    }

    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      const error = new Error("A valid email address is required");
      error.statusCode = 400;
      return next(error);
    }

    if (typeof password !== "string" || password.length < 6) {
      const error = new Error("Password must be at least 6 characters long");
      error.statusCode = 400;
      return next(error);
    }

    if (typeof phone !== "string" || !phone.trim()) {
      const error = new Error("Phone number is required");
      error.statusCode = 400;
      return next(error);
    }

    if (typeof collegeName !== "string" || !collegeName.trim()) {
      const error = new Error("College name is required");
      error.statusCode = 400;
      return next(error);
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const error = new Error("Email is already registered");
      error.statusCode = 409;
      return next(error);
    }

    const SALT = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, SALT);

    const validUserType = ["student", "jobseeker"].includes(userType) ? userType : "student";

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      phone: phone.trim(),
      collegeName: collegeName.trim(),
      userType: validUserType,
    });

    const token = await genToken(newUser, res);

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User Created Successfully",
      data: userResponse,
      token,
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    const err = new Error(error.message || "Registration failed");
    err.statusCode = 500;
    next(err);
  }
};

export const LoginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Strict type check against NoSQL injection
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password.trim()) {
      const error = new Error("Valid email and password are required");
      error.statusCode = 400;
      return next(error);
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });

    // Mitigate User Account Enumeration: uniform error message and timing resistance
    if (!existingUser) {
      // Fake bcrypt comparison to mitigate timing attacks
      await bcrypt.compare("dummy_password", "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012");
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      return next(error);
    }

    const isVerified = await bcrypt.compare(password, existingUser.password);
    if (!isVerified) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      return next(error);
    }

    const token = await genToken(existingUser, res);

    const userResponse = existingUser.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    const err = new Error(error.message || "Login failed");
    err.statusCode = 500;
    next(err);
  }
};

export const LogoutUser = async (req, res, next) => {
  try {
    const cookieOpts = getCookieOptions(0);
    res.clearCookie("Oreo", cookieOpts);
    res.clearCookie("kitkat", cookieOpts);
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error.message);
    next(error);
  }
};

export const GetCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const userResponse = req.user.toObject ? req.user.toObject() : { ...req.user };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    console.error("GetCurrentUser Error:", error.message);
    next(error);
  }
};

export const SendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      const error = new Error("A valid email address is required");
      error.statusCode = 400;
      return next(error);
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });

    // User enumeration defense: Always return 200 with standard notification
    if (!existingUser) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a verification OTP has been dispatched.",
      });
    }

    // Cryptographically secure 6-digit OTP generation
    const newOTP = crypto.randomInt(100000, 1000000).toString();

    const hashedOTP = await bcrypt.hash(newOTP, 10);
    const existingOTP = await OTP.findOne({ email: cleanEmail });
    if (existingOTP) {
      await existingOTP.deleteOne();
    }

    await OTP.create({
      email: cleanEmail,
      otp: hashedOTP,
      attempts: 0,
    });

    await sendOTPEmail(cleanEmail, newOTP);

    res.status(200).json({
      success: true,
      message: "If an account exists with this email, a verification OTP has been dispatched.",
    });
  } catch (error) {
    console.error("SendOtp Error:", error.message);
    next(error);
  }
};

export const VerifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (typeof email !== "string" || typeof otp !== "string" || !email.trim() || !otp.trim()) {
      const error = new Error("Email and OTP are required");
      error.statusCode = 400;
      return next(error);
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingOTP = await OTP.findOne({ email: cleanEmail });

    if (!existingOTP) {
      const error = new Error("OTP expired or invalid");
      error.statusCode = 401;
      return next(error);
    }

    // Brute-force protection: enforce max 5 attempts per OTP
    if (existingOTP.attempts >= 5) {
      await existingOTP.deleteOne();
      const error = new Error("Maximum OTP verification attempts exceeded. Please request a new OTP.");
      error.statusCode = 429;
      return next(error);
    }

    const isVerified = await bcrypt.compare(otp.trim(), existingOTP.otp);
    if (!isVerified) {
      existingOTP.attempts += 1;
      await existingOTP.save();

      const remaining = 5 - existingOTP.attempts;
      const error = new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`);
      error.statusCode = 401;
      return next(error);
    }

    // Single-use token: Immediately delete verified OTP
    await existingOTP.deleteOne();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (!existingUser) {
      const error = new Error("Account not found");
      error.statusCode = 404;
      return next(error);
    }

    await genOTPToken(existingUser, res);
    res.status(200).json({
      success: true,
      message: "OTP verified. You may now reset your password.",
    });
  } catch (error) {
    console.error("VerifyOtp Error:", error.message);
    next(error);
  }
};

export const ResetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      const error = new Error("Password must be at least 6 characters long");
      error.statusCode = 400;
      return next(error);
    }

    const userId = req.user?._id || req.user?.id;
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    const salt = await bcrypt.genSalt(10);
    currentUser.password = await bcrypt.hash(newPassword, salt);
    await currentUser.save();

    // Clear OTP authentication cookie on reset completion
    const cookieOpts = getCookieOptions(0);
    res.clearCookie("kitkat", cookieOpts);
    res.clearCookie("Oreo", cookieOpts);

    res.status(200).json({ success: true, message: "Password Changed Successfully" });
  } catch (error) {
    console.error("ResetPassword Error:", error.message);
    next(error);
  }
};

export const ChangePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (typeof oldPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as your current password",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect current password",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    const token = await genToken(user, res);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      token,
    });
  } catch (error) {
    console.error("ChangePassword Error:", error.message);
    next(error);
  }
};
