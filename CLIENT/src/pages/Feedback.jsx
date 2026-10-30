import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  FiMail,
  FiUser,
  FiMessageSquare,
  FiSend,
  FiAlertCircle,
  FiStar,
  FiChevronDown
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../config/ApiConfig";
import { useAuth } from "../context/AuthContext";

const Feedback = () => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.fullName || "",
    email: user?.email || "",
    type: "general",
    message: "",
    rating: 5,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.name.trim()) newErrors.name = "Name is required";
    if (!data.email.trim()) newErrors.email = "Email address is required";
    if (!data.message.trim()) newErrors.message = "Message is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/feedback", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        type: formData.type,
        message: formData.message.trim(),
        rating: formData.rating,
      });

      toast.success(res.data?.message || "Feedback submitted successfully!");
      setFormData((prev) => ({
        ...prev,
        message: "",
        type: "general",
        rating: 5
      }));
    } catch (error) {
      console.error("Feedback error:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to submit feedback. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-gray-100 flex flex-col bg-grid-pattern relative overflow-hidden">
      {/* Background Radial Glow Backdrops */}
      <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] radial-glow-purple -z-10" />
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] radial-glow-blue -z-10" />

      <Navbar />

      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full flex items-center justify-center">
        <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mx-auto mb-4">
              <FiMessageSquare size={24} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">We Value Your Feedback</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Help us improve PrepOrbit with your thoughts and suggestions.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <FiUser size={16} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.name
                      ? "border-rose-500 focus:ring-rose-500/50"
                      : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/40"
                      }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                    <FiAlertCircle size={12} /> {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <FiMail size={16} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.email
                      ? "border-rose-500 focus:ring-rose-500/50"
                      : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/40"
                      }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                    <FiAlertCircle size={12} /> {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Feedback Type
              </label>
              <div className="relative">
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full pl-4 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/40 transition-all cursor-pointer"
                >
                  <option value="general" className="bg-gray-900">General Feedback</option>
                  <option value="feature" className="bg-gray-900">Feature Request</option>
                  <option value="bug" className="bg-gray-900">Bug Report</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-500">
                  <FiChevronDown size={16} />
                </div>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Rate your experience
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <FiStar
                      size={28}
                      className={`transition-colors ${
                        star <= (hoverRating || formData.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Message
              </label>
              <div className="relative">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us what you think..."
                  rows="4"
                  className={`w-full p-4 bg-white/5 border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all resize-none ${errors.message
                    ? "border-rose-500 focus:ring-rose-500/50"
                    : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/40"
                    }`}
                />
              </div>
              {errors.message && (
                <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                  <FiAlertCircle size={12} /> {errors.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 mt-4 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Submit Feedback <FiSend size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feedback;
