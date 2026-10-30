import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    collegeName: {
      type: String,
      required: true,
      trim: true,
    },
    userType: {
      type: String,
      enum: ["student", "jobseeker"],
      default: "student",
    },
    password: {
      type: String,
      required: true,
    },
    rank: {
      type: Number,
      default: 0,
    },
    masteryScore: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
