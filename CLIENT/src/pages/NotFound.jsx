import { Link } from "react-router-dom";
import { FiHome, FiCompass } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#030014] text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto">
          <div className="inline-flex p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6">
            <FiCompass className="text-5xl animate-pulse" />
          </div>
          <h1 className="text-7xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
          <p className="text-gray-400 text-sm mb-8">
            The page you are looking for doesn't exist or has been moved to another coordinate.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all"
            >
              <FiHome /> Return to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;

