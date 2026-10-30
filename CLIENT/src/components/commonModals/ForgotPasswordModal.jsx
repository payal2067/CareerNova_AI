import React from "react";
import { useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { LuLoaderCircle } from "react-icons/lu";
import api from "../../config/ApiConfig";
import toast from "react-hot-toast";

const ForgotPasswordModal = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const handleCloseModal = () => {
    onClose();
    setFormData({
      email: "",
      otp: "",
      newPassword: "",
      confirmNewPassword: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };
  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      if (!isOtpSent) {
        const res = await api.post("/auth/send-otp", formData);
        toast.success(res.data.message);
        setIsOtpSent(true);
      }

      if (isOtpSent && !isOtpVerified) {
        const res = await api.post("/auth/verify-otp", formData);
        toast.success(res.data.message);
        setIsOtpVerified(true);
      }
      if (isOtpSent && isOtpVerified) {
        const res = await api.post("/auth/reset-password", formData);
        toast.success(res.data.message);
        setIsOtpVerified(true);
        handleCloseModal();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unknown error occurred during registration. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-[#030014]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto relative text-gray-100">
          <header className="flex justify-between items-center p-5 border-b border-white/10">
            <div className="font-bold text-xl text-white">
              Forgot Password
            </div>
            <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors">
              <IoIosCloseCircleOutline className="text-2xl" />
            </button>
          </header>
          <main>
            <div className="p-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-xs font-medium text-gray-300">
                  Your Registered Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  disabled={isLoading || isOtpSent}
                  placeholder="you@example.com"
                />
              </div>

              {isOtpSent && (
                <div className="flex flex-col gap-2 mt-4">
                  <label htmlFor="otp" className="text-xs font-medium text-gray-300">
                    Your OTP
                  </label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    disabled={isLoading || isOtpVerified}
                    placeholder="Enter 6-digit OTP"
                  />
                </div>
              )}

              {isOtpSent && isOtpVerified && (
                <>
                  <div className="flex flex-col gap-2 mt-4">
                    <label htmlFor="newPassword" className="text-xs font-medium text-gray-300">
                      Create Your New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      disabled={isLoading}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <label
                      htmlFor="confirmNewPassword"
                      className="text-xs font-medium text-gray-300"
                    >
                      Confirm Your New Password
                    </label>
                    <input
                      type="password"
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      value={formData.confirmNewPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      disabled={isLoading}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}
            </div>
          </main>
          <footer className="w-full p-5 border-t border-white/10 flex justify-end gap-3 bg-white/5 rounded-b-2xl">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-violet-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
              onClick={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LuLoaderCircle className="animate-spin" /> Loading...
                </>
              ) : isOtpSent ? (
                isOtpVerified ? (
                  "Reset Password"
                ) : (
                  "Verify OTP"
                )
              ) : (
                "Send OTP"
              )}
            </button>
          </footer>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordModal;
