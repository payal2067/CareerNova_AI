import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCpu,
  FiAlertCircle,
  FiCheckCircle
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../config/ApiConfig";
import { useAuth } from "../context/AuthContext";
import ForgotPasswordModal from "../components/commonModals/ForgotPasswordModal"
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.email.trim()) {
      newErrors.email = "Email address is required";
    }
    if (!data.password) {
      newErrors.password = "Password is required";
    }
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
      const res = await api.post("/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      toast.success(res.data?.message || "Logged in successfully!");
      if (res.data?.data) {
        login(res.data.data, res.data.token || null);
      }
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Login failed. Please check your credentials and try again.";
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

      <ForgotPasswordModal open={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />

      <Navbar />

      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full flex items-center justify-center">
        <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mx-auto mb-4">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)" stroke="currentColor" strokeWidth="1.75" opacity="0.85" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <circle cx="18" cy="8" r="1.5" fill="#38bdf8" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Welcome Back</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Sign in to your PrepOrbit account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.email
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-300">
                  Password
                </label>
                <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-xs text-indigo-400 hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <FiLock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.password
                    ? "border-rose-500 focus:ring-rose-500/50"
                    : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/40"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 cursor-pointer"
                >
                  {showPassword ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                  <FiAlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In <FiArrowRight size={16} />
                </>
              )}
            </button>

            {/* Register Link */}
            <p className="text-center text-xs text-gray-400 pt-2">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline transition-colors"
              >
                Register here
              </Link>
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;