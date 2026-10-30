import express from "express";
import {
  RegisterUser,
  LoginUser,
  LogoutUser,
  GetCurrentUser,
  SendOtp,
  VerifyOtp,
  ResetPassword,
  ChangePassword,
} from "../controller/auth.controller.js";
import { AuthProtect, OTPAuthProtect } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/securityMiddleware.js";

const router = express.Router();

// Apply auth rate limiting on public authentication actions
router.post("/register", authLimiter, RegisterUser);
router.post("/login", authLimiter, LoginUser);
router.get("/me", AuthProtect, GetCurrentUser);
router.post("/logout", LogoutUser);
router.post("/send-otp", authLimiter, SendOtp);
router.post("/verify-otp", authLimiter, VerifyOtp);
router.post("/reset-password", authLimiter, OTPAuthProtect, ResetPassword);
router.patch("/change-password", AuthProtect, ChangePassword);

export default router;
