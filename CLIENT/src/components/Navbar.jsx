import { useNavigate, useLocation } from 'react-router-dom';
import { FiTrendingUp, FiVideo, FiMenu, FiGrid, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10 bg-[#030014]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex-shrink-0 flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-white group cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)" stroke="currentColor" strokeWidth="1.75" opacity="0.85" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <circle cx="18" cy="8" r="1.5" fill="#38bdf8" className="animate-pulse" />
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">CareerNova<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">_AI</span></span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => navigate('/')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-none ${isActive('/') ? 'text-indigo-400 bg-white/5' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
            >
              Overview
            </button>

            {user && (
              <button
                onClick={() => navigate('/dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer focus:outline-none ${isActive('/dashboard') ? 'text-indigo-400 bg-white/5' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                <FiGrid size={14} /> Dashboard
              </button>
            )}

            <button
              onClick={() => navigate('/analyze')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer focus:outline-none ${isActive('/analyze') ? 'text-indigo-400 bg-white/5' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
            >
              <FiTrendingUp size={14} /> Resume Analyzer
            </button>
            <button
              onClick={() => navigate('/interview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer focus:outline-none ${isActive('/interview')
                ? 'text-indigo-400 bg-white/5'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
            >
              <FiVideo size={14} /> Mock Interview
            </button>

          </div>

          {/* User Auth Buttons / Profile badge */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors text-xs font-semibold text-gray-200"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <span>{user.fullName || user.email}</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Log out"
                >
                  <FiLogOut size={16} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer focus:outline-none ${isActive('/login')
                    ? 'text-indigo-400 bg-white/5'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20 cursor-pointer focus:outline-none"
                >
                  Register
                </button>
              </>
            )}
          </div>


          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors focus:outline-none">
              <FiMenu size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;