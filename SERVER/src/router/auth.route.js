import express from "express";
import { RegisterUser, LoginUser, LogoutUser, GetCurrentUser,SendOtp,VerifyOtp,ResetPassword } from "../controller/auth.controller.js";
import { AuthProtect } from "../middleware/authMiddleware.js";
import { OTPAuthProtect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/register", RegisterUser);
router.post("/login", LoginUser);
router.get("/me", AuthProtect, GetCurrentUser);
router.post("/logout", LogoutUser);
router.post("/send-otp", SendOtp);
router.post("/verify-otp", VerifyOtp);
router.post("/reset-password", OTPAuthProtect, ResetPassword);

export default router;