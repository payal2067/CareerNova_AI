import { FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="glass-panel border-t border-white/10 bg-[#030014]/90 py-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="relative w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)" stroke="currentColor" strokeWidth="1.75" opacity="0.85" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <circle cx="18" cy="8" r="1.5" fill="#38bdf8" />
                </svg>
              </div>
              <span className="font-extrabold text-lg text-white">
                Prep<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Orbit</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              Your 24/7 personal career accelerator. Upload resumes, detect critical keywords, adjust match metrics, and train with real mock questions.
            </p>
            <div className="flex space-x-4 text-gray-400">
              <a href="#" className="hover:text-indigo-400 transition-colors"><FiTwitter size={18} /></a>
              <a href="#" className="hover:text-indigo-400 transition-colors"><FiLinkedin size={18} /></a>
              <a href="#" className="hover:text-indigo-400 transition-colors"><FiGithub size={18} /></a>
            </div>
          </div>

          {/* Nav Lists */}
          <div>
            <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">Core Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/analyze" className="hover:text-indigo-400 transition-colors">Resume Matcher</a></li>
              <li><a href="/interview" className="hover:text-indigo-400 transition-colors">AI Interview Room</a></li>
              <li><a href="/feedback" className="hover:text-indigo-400 transition-colors">Submit Feedback</a></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">Weekly Career Tips</h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-gray-200 flex-grow"
              />
              <button className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer">
                Join
              </button>
            </div>
            <p className="text-[10px] text-gray-500">Subscribe for custom interview templates and AI insights.</p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <span>&copy; {new Date().getFullYear()} CareerNova_AI. All rights reserved.</span>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-gray-300">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;