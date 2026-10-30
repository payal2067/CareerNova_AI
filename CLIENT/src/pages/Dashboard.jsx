import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/ApiConfig';
import {
  FiUser, FiTrendingUp, FiVideo, FiAward,
  FiArrowRight, FiFileText, FiRefreshCw, FiEdit3, FiBarChart2
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resumeHistory, setResumeHistory] = useState([]);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resume bullet point rewriter modal state
  const [showRewriter, setShowRewriter] = useState(false);
  const [bulletText, setBulletText] = useState('');
  const [targetRoleInput, setTargetRoleInput] = useState('Software Engineer');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenResults, setRewrittenResults] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [resumesRes, interviewsRes] = await Promise.all([
          api.get('/ai/history').catch(() => ({ data: { history: [] } })),
          api.get('/interview/history').catch(() => ({ data: { sessions: [] } }))
        ]);

        setResumeHistory(resumesRes.data?.history || []);
        setInterviewHistory(interviewsRes.data?.sessions || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Handle Bullet Point Rewriter submit
  const handleRewrite = async (e) => {
    e.preventDefault();
    if (!bulletText.trim()) return;

    setIsRewriting(true);
    setRewrittenResults([]);
    try {
      const res = await api.post('/ai/rewrite-bullet', {
        bulletPoint: bulletText,
        targetRole: targetRoleInput
      });
      if (res.data?.improvedBullets) {
        setRewrittenResults(res.data.improvedBullets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRewriting(false);
    }
  };

  // Calculate aggregates
  const avgResumeScore = resumeHistory.length
    ? Math.round(resumeHistory.reduce((acc, curr) => acc + (curr.finalStrengthScore || 0), 0) / resumeHistory.length)
    : 0;

  const avgInterviewScore = interviewHistory.length
    ? Math.round(interviewHistory.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / interviewHistory.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#030014] text-gray-100 flex flex-col bg-grid-pattern relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] radial-glow-purple -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] radial-glow-blue -z-10" />

      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-24 sm:px-6 lg:px-8 space-y-8">

        {/* Welcome Header */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-blue-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-xl shadow-indigo-500/20">
              {user?.fullName ? user.fullName[0].toUpperCase() : <FiUser />}
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                Candidate Dashboard • {user?.userType || 'Job Seeker'}
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-0.5">
                Welcome back, {user?.fullName || 'Candidate'}!
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {user?.collegeName || 'Career Advancement Platform'} • {user?.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/analyze')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
            >
              <FiTrendingUp /> New Scan
            </button>
            <button
              onClick={() => navigate('/interview')}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2 cursor-pointer"
            >
              <FiVideo /> Practice Interview
            </button>
            <button
              onClick={() => setShowRewriter(true)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <FiEdit3 /> AI Bullet Rewriter
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-indigo-400">
              <span className="text-xs uppercase tracking-wider font-semibold">Resumes Scanned</span>
              <FiFileText size={20} />
            </div>
            <p className="text-3xl font-extrabold text-white">{resumeHistory.length}</p>
            <p className="text-xs text-gray-400">Target Role Scans</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs uppercase tracking-wider font-semibold">Avg ATS Match</span>
              <FiAward size={20} />
            </div>
            <p className="text-3xl font-extrabold text-emerald-400">{avgResumeScore}%</p>
            <p className="text-xs text-gray-400">Overall ATS Score Average</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-violet-400">
              <span className="text-xs uppercase tracking-wider font-semibold">Mock Interviews</span>
              <FiVideo size={20} />
            </div>
            <p className="text-3xl font-extrabold text-white">{interviewHistory.length}</p>
            <p className="text-xs text-gray-400">Completed Practice Sessions</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-blue-400">
              <span className="text-xs uppercase tracking-wider font-semibold">Avg Interview Score</span>
              <FiTrendingUp size={20} />
            </div>
            <p className="text-3xl font-extrabold text-blue-400">{avgInterviewScore}/100</p>
            <p className="text-xs text-gray-400">Performance Across Questions</p>
          </div>
        </div>

        {/* AI Resume Bullet Points Rewriter Modal */}
        {showRewriter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-panel max-w-2xl w-full p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 relative animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                    <FiEdit3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Resume Bullet Points Rewriter</h3>
                    <p className="text-xs text-gray-400">Transform weak bullets into high-impact, metrics-driven achievements.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRewriter(false)}
                  className="text-gray-400 hover:text-white text-xl font-bold px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRewrite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">Target Role</label>
                  <input
                    type="text"
                    value={targetRoleInput}
                    onChange={(e) => setTargetRoleInput(e.target.value)}
                    className="w-full bg-[#07051a] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">Original Bullet Point</label>
                  <textarea
                    value={bulletText}
                    onChange={(e) => setBulletText(e.target.value)}
                    rows="3"
                    className="w-full bg-[#07051a] border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder="e.g. Worked on website speed and built React components for user dashboard."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRewriting || !bulletText.trim()}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isRewriting ? <FiRefreshCw className="animate-spin" /> : <FiEdit3 />}
                  Generate Improved Bullet Variations
                </button>
              </form>

              {rewrittenResults.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">High-Impact Variations:</h4>
                  {rewrittenResults.map((bullet, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-200 leading-relaxed font-mono">
                      • {bullet}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Left Column: Mock Interview Performance Trend */}
          <div className="w-full xl:w-[500px] flex-shrink-0">
            {interviewHistory.length > 0 && (
              <div className="glass-panel p-6 rounded-2xl border border-white/5 h-full flex flex-col space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <FiBarChart2 className="text-indigo-400" /> Performance Analysis
                  </h3>
                  <p className="text-xs text-gray-400">Chronological analysis of your overall interview ratings</p>
                </div>
                <div className="w-full flex-grow min-h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={interviewHistory.map((session) => ({
                        name: new Date(session.completedAt || session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                        Score: session.overallScore
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a243d" />
                      <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '10px' }} />
                      <YAxis domain={[0, 100]} stroke="#6b7280" style={{ fontSize: '10px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#07051a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#818cf8', fontSize: '12px' }}
                      />
                      <Line type="monotone" dataKey="Score" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Recent Activity Sections */}
          <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Recent Resume Scans */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <FiFileText className="text-indigo-400" /> Recent Resume Scans
                </h3>
                <button
                  onClick={() => navigate('/analyze')}
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Scan New <FiArrowRight />
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-gray-500 text-sm">Loading history...</div>
              ) : resumeHistory.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  No resume scans recorded yet. Upload your first resume on the Resume Analyzer page!
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {resumeHistory.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-indigo-300 block">
                          {item.targetRole || 'Software Development'}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()} • {item.extractedSkills?.length || 0} skills detected
                        </span>
                        {item.missingSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.missingSkills.slice(0, 3).map((m, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[9px]">
                                +{m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-2xl font-extrabold text-emerald-400 block">
                          {item.finalStrengthScore}%
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase">Match Score</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Mock Interviews */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <FiVideo className="text-violet-400" /> Recent Mock Interviews
                </h3>
                <button
                  onClick={() => navigate('/interview')}
                  className="text-xs text-violet-400 hover:underline flex items-center gap-1"
                >
                  Start Room <FiArrowRight />
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-gray-500 text-sm">Loading interview history...</div>
              ) : interviewHistory.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  No interview sessions recorded yet. Launch the AI Mock Interview room to practice!
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {interviewHistory.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-violet-300 block">
                          {item.targetRole}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()} • {item.questions?.length || 0} Questions • {item.difficulty}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-2xl font-extrabold text-indigo-400 block">
                          {item.overallScore}/100
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
