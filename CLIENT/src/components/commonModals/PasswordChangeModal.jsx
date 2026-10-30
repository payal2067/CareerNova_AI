import { useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { LuLoaderCircle } from "react-icons/lu";
import api from "../../config/ApiConfig";
import toast from "react-hot-toast";

const PasswordChangeModal = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleCloseModal = () => {
    setFormData({
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleChangePassword = async () => {
    setIsLoading(true);
    try {
      if (formData.newPassword !== formData.confirmNewPassword) {
        toast.error("New password and confirm password do not match.");
        setIsLoading(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error("Password must be at least 6 characters long.");
        setIsLoading(false);
        return;
      }
      await api.patch("/auth/change-password", {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      toast.success("Password changed successfully!");
      handleCloseModal();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unknown error occurred during password change. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-[#030014]/80 backdrop-blur-md flex justify-center items-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl border border-white/10 max-h-[85vh] overflow-y-auto relative text-gray-100">
        <header className="flex justify-between items-center p-5 border-b border-white/10">
          <div className="font-bold text-xl text-white">Change Password</div>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IoIosCloseCircleOutline className="text-2xl" />
          </button>
        </header>
        <main>
          <div className="p-6 space-y-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="oldPassword"
                className="text-xs font-medium text-gray-300"
              >
                Current Password
              </label>
              <input
                type="password"
                id="oldPassword"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                disabled={isLoading}
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="newPassword"
                className="text-xs font-medium text-gray-300"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                disabled={isLoading}
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirmNewPassword"
                className="text-xs font-medium text-gray-300"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                disabled={isLoading}
                placeholder="••••••••"
              />
            </div>
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
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-violet-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
            onClick={handleChangePassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LuLoaderCircle className="animate-spin" /> Changing...
              </>
            ) : (
              "Change Password"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PasswordChangeModal;

