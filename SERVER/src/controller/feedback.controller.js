import Feedback from "../models/feedback.model.js";

export const submitFeedback = async (req, res, next) => {
  try {
    const { name, email, type, message, rating } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Name, email, and message are required" });
    }

    const newFeedback = new Feedback({
      name,
      email,
      type,
      message,
      rating
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
