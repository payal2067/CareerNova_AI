import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiBriefcase,
  FiBookOpen,
  FiAlertCircle
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { userType: paramUserType } = useParams();

  const [formData, setFormData] = useState({
    userType: paramUserType || "jobseeker",
    fullName: "",
    email: "",
    phone: "",
    collegeName: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const userTypes = [
    { id: "student", label: "Student", icon: FiBookOpen, desc: "Campus & Learning" },
    { id: "jobseeker", label: "Job Seeker", icon: FiBriefcase, desc: "Career Advancement" }
  ];

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "bg-gray-700" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "bg-rose-500", textColor: "text-rose-400" };
    if (score <= 4) return { score, label: "Good", color: "bg-amber-500", textColor: "text-amber-400" };
    return { score, label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-400" };
  };

  const pwdStrength = getPasswordStrength(formData.password);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };


  const handleUserTypeSelect = (typeId) => {
    setFormData((prev) => ({ ...prev, userType: typeId }));
  };

  const validateForm = (data) => {
    const newErrors = {};

    if (!data.fullName.trim()) newErrors.fullName = "Full name is required";

    if (!data.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!data.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!data.collegeName.trim()) {
      newErrors.collegeName = "College / Organization name is required";
    }

    if (!data.password) {
      newErrors.password = "Password is required";
    } else if (data.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!data.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!data.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the Terms of Service";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      toast.error("Please fix the highlighted errors before submitting.");
      return;
    }


    console.log("Form submitted:", formData);


    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        collegeName: formData.collegeName.trim(),
        userType: formData.userType,
        password: formData.password,
      });

      toast.success("Account created successfully! Welcome aboard.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Registration failed.";
      toast.error(errorMsg);
      if (error.response?.status === 409) {
        setErrors((prev) => ({ ...prev, email: "This email is already registered." }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-gray-100 flex flex-col bg-grid-pattern relative overflow-hidden">
      <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] radial-glow-purple -z-10" />
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] radial-glow-blue -z-10" />

      <Navbar />

      <main className="flex-grow pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full flex items-center justify-center">
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl w-full">

          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mx-auto mb-3">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)" stroke="currentColor" strokeWidth="1.75" opacity="0.85" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <circle cx="18" cy="8" r="1.5" fill="#38bdf8" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Get started with your free personalized PrepOrbit account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
                I am joining as a:
              </label>
              <div className="grid grid-cols-2 gap-4">
                {userTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.userType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleUserTypeSelect(type.id)}
                      className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${isSelected
                          ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                        }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-indigo-500/30 text-indigo-300" : "bg-white/5 text-gray-400"}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{type.label}</div>
                        <div className="text-[10px] text-gray-400">{type.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Full Name <span className="text-indigo-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <FiUser size={16} />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.fullName
                        ? "border-rose-500 focus:ring-rose-500/50"
                        : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/40"
                      }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                    <FiAlertCircle size={12} /> {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Email Address <span className="text-indigo-400">*</span>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Phone Number <span className="text-indigo-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <FiPhone size={16} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 890"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.phone
                        ? "border-rose-500 focus:ring-rose-500/50"
                        : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/40"
                      }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                    <FiAlertCircle size={12} /> {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  College / Organization <span className="text-indigo-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <FiBookOpen size={16} />
                  </div>
                  <input
                    type="text"
                    name="collegeName"
                    value={formData.collegeName}
                    onChange={handleInputChange}
                    placeholder="e.g. Stanford University"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.collegeName
                        ? "border-rose-500 focus:ring-rose-500/50"
                        : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/40"
                      }`}
                  />
                </div>
                {errors.collegeName && (
                  <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                    <FiAlertCircle size={12} /> {errors.collegeName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Password <span className="text-indigo-400">*</span>
                </label>
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

                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Strength:</span>
                      <span className={`font-semibold ${pwdStrength.textColor}`}>
                        {pwdStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-full flex-1 transition-all ${lvl <= pwdStrength.score ? pwdStrength.color : "bg-transparent"
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                    <FiAlertCircle size={12} /> {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Confirm Password <span className="text-indigo-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <FiLock size={16} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.confirmPassword
                        ? "border-rose-500 focus:ring-rose-500/50"
                        : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/40"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                    <FiAlertCircle size={12} /> {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  className="mt-0.5 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />
                <span className="text-xs text-gray-400 group-hover:text-gray-300 leading-normal">
                  I agree to the Terms of Service & Privacy Policy.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                  <FiAlertCircle size={12} /> {errors.agreeTerms}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account <FiArrowRight size={16} />
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 pt-1">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline transition-colors"
              >
                Log in here
              </Link>
            </p>

          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;