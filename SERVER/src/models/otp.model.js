import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 5, // The document will be automatically deleted after 5 minutes
    },
  }
);

// Compound index to quickly find OTP by email
otpSchema.index({ email: 1 });

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
