import Feedback from "../models/feedback.model.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const submitFeedback = async (req, res, next) => {
  try {
    const { name, email, type, message, rating } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      return res.status(400).json({ success: false, message: "Valid name, email, and message are required" });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: "A valid email address is required" });
    }

    const cleanName = name.trim().slice(0, 100);
    const cleanEmail = email.trim().toLowerCase().slice(0, 150);
    const cleanMessage = message.trim().slice(0, 2000);
    const cleanType = typeof type === "string" ? type.trim().slice(0, 50) : "General";
    const cleanRating = typeof rating === "number" ? Math.max(1, Math.min(5, Math.round(rating))) : 5;

    const newFeedback = new Feedback({
      name: cleanName,
      email: cleanEmail,
      type: cleanType,
      message: cleanMessage,
      rating: cleanRating,
    });

    await newFeedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully!",
      feedback: newFeedback,
    });
  } catch (error) {
    next(error);
  }
};
