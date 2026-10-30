import User from "../models/user.model.js";
import OTP from "../models/otp.model.js";
import bcrypt from "bcrypt";
import { genToken, genOTPToken } from "../utils/auth.service.js";
import { sendOTPEmail } from "../utils/email.service.js";

export const RegisterUser = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, collegeName, userType } = req.body;

    if (!fullName?.trim()) {
      const error = new Error("Full name is required");
      error.statusCode = 400;
      return next(error);
    }

    if (!email?.trim()) {
      const error = new Error("Email is required");
      error.statusCode = 400;
      return next(error);
    }

    if (!password?.trim()) {
      const error = new Error("Password is required");
      error.statusCode = 400;
      return next(error);
    }

    if (!phone?.trim()) {
      const error = new Error("Phone number is required");
      error.statusCode = 400;
      return next(error);
    }

    if (!collegeName?.trim()) {
      const error = new Error("College name is required");
      error.statusCode = 400;
      return next(error);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const error = new Error("Email is already registered");
      error.statusCode = 409;
      return next(error);
    }

    const SALT = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, SALT);

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      collegeName: collegeName.trim(),
      userType: userType || "student",
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

    if (!email?.trim() || !password?.trim()) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      return next(error);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      const error = new Error("Email not registered");
      error.statusCode = 404;
      return next(error);
    }

    const isVerified = await bcrypt.compare(password, existingUser.password);
    if (!isVerified) {
      const error = new Error("Incorrect password");
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
    res.clearCookie("Oreo", { maxAge: 0 });
    res.status(200).json({ message: "Logout Successfully" });
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
    if (!email) {
      const error = new Error("Email is required");
      error.statusCode = 400;
      return next(error);
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      const error = new Error("Email not registered");
      error.statusCode = 404;
      return next(error);
    }

    // Generate and send OTP here
    const newOTP = (Math.floor(Math.random() * 1000000) + 100000)
      .toString()
      .slice(0, 6);

    //Send OTP via Email
    const hashedOTP = await bcrypt.hash(newOTP, 10);
    const existingOTP = await OTP.findOne({ email });
    if (existingOTP) {
      await existingOTP.deleteOne();
    }

    await OTP.create({
      email,
      otp: hashedOTP,
    });
    await sendOTPEmail(email, newOTP);

    res.status(200).json({ message: `OTP sent on '${email}'` });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

export const VerifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email) {
      const error = new Error("Email is required");
      error.statusCode = 400;
      return next(error);
    }

    const existingOTP = await OTP.findOne({ email });
    if (!existingOTP) {
      const error = new Error("OTP Expired");
      error.statusCode = 401;
      return next(error);
    }

    const isVerified = await bcrypt.compare(otp, existingOTP.otp);
    if (!isVerified) {
      const error = new Error("OTP Expired");
      error.statusCode = 401;
      return next(error);
    }

    await existingOTP.deleteOne();

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      const error = new Error("Email not registered");
      error.statusCode = 404;
      return next(error);
    }

    await genOTPToken(existingUser, res);
    res
      .status(200)
      .json({ message: "OTP verified. Create You New Password Now" });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

export const ResetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    const currentUser = req.user;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    currentUser.password = hashedPassword;

    await currentUser.save();

    res.status(200).json({ message: "Password Changed" });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};
