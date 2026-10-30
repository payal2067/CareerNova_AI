import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiVideo, FiCheckCircle, FiAlertTriangle, FiCpu, FiMessageSquare, FiMic, FiArrowRight, FiSliders, FiUsers, FiTarget } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scan');

  // States for Resume Simulator
  const [simResume, setSimResume] = useState('');
  const [simJd, setSimJd] = useState('');
  const [simScanResult, setSimScanResult] = useState(null);
  const [simScanning, setSimScanning] = useState(false);

  // States for Interview Simulator
  const [simRole, setSimRole] = useState('Frontend Engineer');
  const [simAnswers, setSimAnswers] = useState([]);
  const [simAnswerText, setSimAnswerText] = useState('');
  const [simCoachFeedback, setSimCoachFeedback] = useState(null);
  const [simCoachThinking, setSimCoachThinking] = useState(false);

  const handleSimScan = () => {
    if (!simResume || !simJd) return;
    setSimScanning(true);
    setSimScanResult(null);

    setTimeout(() => {
      setSimScanning(false);
      setSimScanResult({
        score: 78,
        matchText: 'High Relevance',
        matched: ['React.js', 'Tailwind CSS', 'Vite', 'Git'],
        missing: ['TypeScript', 'CI/CD Pipelines'],
        tip: 'Integrate TypeScript skills in your primary skills section and add a CI/CD build project to close the gaps.'
      });
    }, 1500);
  };

  const handleSimSend = () => {
    if (!simAnswerText.trim()) return;

    const userMsg = {
      sender: 'user',
      text: simAnswerText
    };

    setSimAnswers(prev => [...prev, userMsg]);
    const answer = simAnswerText;
    setSimAnswerText('');
    setSimCoachThinking(true);

    setTimeout(() => {
      setSimAnswers(prev => [
        ...prev,
        {
          sender: 'coach',
          text: `Great start. You explained the hooks setup well. Let's make it punchier: Can you describe how you managed application state for complex user flows? Did you use Context API, Redux Toolkit, or local states?`
        }
      ]);

      setSimCoachFeedback({
        score: 8.5,
        strength: 'Detailed setup explanation and usage of React state hooks.',
        suggestion: 'Mention state management tools (like Redux Toolkit or Zustand) to show you understand complex application data flows.'
      });

      setSimCoachThinking(false);
    }, 1500);
  };

  const startSimInterview = () => {
    setSimAnswers([
      {
        sender: 'coach',
        text: `Welcome! Let's simulate a ${simRole} interview. Tell me, how do you handle optimizing a slow-loading web page? What steps do you take?`
      }
    ]);
    setSimCoachFeedback(null);
  };

  return (
    <>
      <div className="min-h-screen bg-[#030014] text-gray-100 flex flex-col bg-grid-pattern relative overflow-hidden">
        {/* Decorative Blur Backdrops */}
        <div className="absolute top-[5%] left-[-10%] w-[600px] h-[600px] radial-glow-purple -z-10" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] radial-glow-blue -z-10" />
        <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[500px] radial-glow-purple opacity-40 -z-10" />

        <Navbar />


        <main className="flex-grow">
          {/* HERO SECTION */}
          <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Content */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold animate-pulse">
                  <FiCpu /> Next-Gen AI Career Acceleration
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                  Land Your Dream Job. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400">
                    Perfect Your Pitch.
                  </span>
                </h1>

                <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Resume scanning, Applicant Tracking System (ATS) optimization, and voice/text interactive roleplay interviews with Coach Ava. Your career acceleration starts here.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <button
                    onClick={() => navigate('/analyze')}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-base cursor-pointer focus:outline-none"
                  >
                    <FiTrendingUp /> Analyze Resume
                  </button>
                  <button
                    onClick={() => navigate('/interview')}
                    className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-base cursor-pointer focus:outline-none"
                  >
                    <FiVideo /> Practice Interview
                  </button>
                </div>

                {/* Quick stats banner */}
                <div className="grid grid-cols-3 gap-4 pt-6 max-w-md mx-auto lg:mx-0 text-center lg:text-left border-t border-white/5">
                  <div>
                    <span className="block text-2xl font-extrabold text-white">93%</span>
                    <span className="text-xs text-gray-500">Interview Rate</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-extrabold text-white">4.9/5</span>
                    <span className="text-xs text-gray-500">Coach Feedback</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-extrabold text-white">12k+</span>
                    <span className="text-xs text-gray-500">Offers Landed</span>
                  </div>
                </div>
              </div>

              {/* Right Interactive Simulator Widget */}
              <div className="lg:col-span-6 w-full max-w-xl mx-auto">
                <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-float">
                  {/* Tabs selection */}
                  <div className="flex border-b border-white/5 bg-[#0a081c]/70 p-2">
                    <button
                      onClick={() => setActiveTab('scan')}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'scan'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      <FiTrendingUp size={16} /> Resume Match Score
                    </button>
                    <button
                      onClick={() => setActiveTab('interview')}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'interview'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      <FiVideo size={16} /> Interview Sandbox
                    </button>
                  </div>

                  {/* Simulated scan content */}
                  {activeTab === 'scan' && (
                    <div className="p-6 space-y-4">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Try the quick scanner:</div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Paste simple resume text (e.g. React Developer with 3 yrs exp...)"
                          value={simResume}
                          onChange={(e) => setSimResume(e.target.value)}
                          className="w-full bg-[#030014]/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-gray-200"
                        />
                        <input
                          type="text"
                          placeholder="Target job requirements (e.g. Frontend developer with React and TypeScript...)"
                          value={simJd}
                          onChange={(e) => setSimJd(e.target.value)}
                          className="w-full bg-[#030014]/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-gray-200"
                        />
                        <button
                          onClick={handleSimScan}
                          disabled={!simResume || !simJd || simScanning}
                          className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                        >
                          {simScanning ? 'Scanning and parsing...' : 'Simulate ATS Alignment Score'}
                        </button>
                      </div>

                      {simScanResult && (
                        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-semibold">Resume Match Alignment</span>
                            <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
                              {simScanResult.matchText}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="26" className="stroke-white/5 fill-none" strokeWidth="4" />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="26"
                                  className="stroke-indigo-500 fill-none"
                                  strokeWidth="4"
                                  strokeDasharray="163"
                                  strokeDashoffset={163 - (163 * simScanResult.score) / 100}
                                />
                              </svg>
                              <span className="absolute text-xs font-extrabold">{simScanResult.score}%</span>
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="text-gray-300">
                                <span className="text-emerald-400 font-bold">✓ Matched: </span>
                                {simScanResult.matched.join(', ')}
                              </div>
                              <div className="text-gray-400">
                                <span className="text-rose-400 font-bold">✗ Missing: </span>
                                {simScanResult.missing.join(', ')}
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-white/5 pt-2 text-[10px] text-indigo-300 leading-relaxed italic">
                            💡 {simScanResult.tip}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Simulated interview sandbox */}
                  {activeTab === 'interview' && (
                    <div className="p-6 space-y-4">
                      {simAnswers.length === 0 ? (
                        <div className="text-center py-6 space-y-4">
                          <div className="text-xs text-gray-400">Select simulated job profile to start:</div>
                          <select
                            value={simRole}
                            onChange={(e) => setSimRole(e.target.value)}
                            className="w-full max-w-xs mx-auto bg-[#030014] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-gray-200"
                          >
                            <option>Frontend Engineer</option>
                            <option>Product Manager</option>
                            <option>Backend Architect</option>
                          </select>
                          <button
                            onClick={startSimInterview}
                            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-colors"
                          >
                            Initiate Chat Roleplay
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Conversation logs */}
                          <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                            {simAnswers.map((msg, i) => (
                              <div key={i} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'coach' && (
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                                    A
                                  </div>
                                )}
                                <div className={`p-2.5 rounded-xl text-[11px] max-w-[85%] leading-relaxed ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 border border-white/5 text-gray-300 rounded-tl-none'
                                  }`}>
                                  {msg.text}
                                </div>
                              </div>
                            ))}

                            {simCoachThinking && (
                              <div className="flex gap-2.5 items-center">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 animate-pulse">
                                  A
                                </div>
                                <span className="text-[10px] text-gray-500 italic">Ava is typing critique...</span>
                              </div>
                            )}
                          </div>

                          {/* Input chat form */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Type practice answer (e.g. I use lazy loading...)"
                              value={simAnswerText}
                              onChange={(e) => setSimAnswerText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSimSend()}
                              className="flex-grow bg-[#030014] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-gray-200"
                            />
                            <button
                              onClick={handleSimSend}
                              disabled={!simAnswerText.trim() || simCoachThinking}
                              className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-bold text-white transition-colors"
                            >
                              Send
                            </button>
                          </div>

                          {/* Feedback card */}
                          {simCoachFeedback && (
                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1.5 animate-fadeIn">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-400 font-semibold">Immediate Coaching Grade</span>
                                <span className="text-emerald-400 font-extrabold">{simCoachFeedback.score} / 10</span>
                              </div>
                              <p className="text-[10px] text-gray-300 leading-relaxed">
                                <span className="text-emerald-400 font-semibold">Strength:</span> {simCoachFeedback.strength}
                              </p>
                              <p className="text-[10px] text-gray-400 leading-relaxed">
                                <span className="text-violet-300 font-semibold">Tip:</span> {simCoachFeedback.suggestion}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* CORE PLATFORM FEATURES SECTION */}
          <section className="py-20 md:py-24 border-t border-white/5 relative bg-[#06041a]/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Personalized Career Suite</span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Everything You Need to Succeed</h2>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                  We combine industry-leading ATS parsing algorithms with powerful AI conversation feedback to give you the perfect coaching environment.
                </p>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="glass-panel p-8 rounded-2xl border border-white/5 glass-panel-hover flex flex-col items-start space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl">
                    <FiTrendingUp />
                  </div>
                  <h3 className="text-xl font-bold text-white">ATS Gap Matcher</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Upload your target role descriptions and scan details instantly. Identify keyword deficits, syntax issues, and formatting problems before submission.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="glass-panel p-8 rounded-2xl border border-white/5 glass-panel-hover flex flex-col items-start space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center text-xl">
                    <FiVideo />
                  </div>
                  <h3 className="text-xl font-bold text-white">Interactive Coach Ava</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Practice responding in real-time. Coach Ava reviews grammatical layouts, highlights missing credentials, and evaluates response structure templates.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="glass-panel p-8 rounded-2xl border border-white/5 glass-panel-hover flex flex-col items-start space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center text-xl">
                    <FiSliders />
                  </div>
                  <h3 className="text-xl font-bold text-white">Confidence Indicators</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Receive scores assessing sentence structuring, technical jargon presence, confidence indexes, and recommended structural reformats.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* GUIDED JOURNEY */}
          <section className="py-20 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Step-by-Step Pathway</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">How PrepOrbit Works</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Step 1 */}
              <div className="relative text-center md:text-left space-y-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-extrabold flex items-center justify-center mx-auto md:mx-0 shadow-lg shadow-indigo-500/20">
                  1
                </div>
                <h3 className="font-bold text-lg text-white">Upload & Align</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Paste your resume details alongside your target job specifications to map keywords.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative text-center md:text-left space-y-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 text-white font-extrabold flex items-center justify-center mx-auto md:mx-0 shadow-lg shadow-purple-500/20">
                  2
                </div>
                <h3 className="font-bold text-lg text-white">Address Gaps</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Follow tailored, automated rewrite suggestions to ensure high ranking alignment.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative text-center md:text-left space-y-3">
                <div className="w-10 h-10 rounded-full bg-violet-500 text-white font-extrabold flex items-center justify-center mx-auto md:mx-0 shadow-lg shadow-violet-500/20">
                  3
                </div>
                <h3 className="font-bold text-lg text-white">Practice Roleplay</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Receive interactive interview questions from Coach Ava based on the role requirements.
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative text-center md:text-left space-y-3">
                <div className="w-10 h-10 rounded-full bg-pink-500 text-white font-extrabold flex items-center justify-center mx-auto md:mx-0 shadow-lg shadow-pink-500/20">
                  4
                </div>
                <h3 className="font-bold text-lg text-white">Excel & Land</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Review scores, read suggestion summaries, and enter negotiations with extreme confidence.
                </p>
              </div>
            </div>
          </section>

          {/* CTA BANNER */}
          <section className="py-16 md:py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
            <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 bg-gradient-to-tr from-indigo-950/45 via-indigo-900/30 to-[#030014]/80 text-center relative overflow-hidden flex flex-col items-center justify-center">
              {/* Background elements */}
              <div className="absolute inset-0 radial-glow-purple opacity-30 -z-10" />

              <h2 className="text-3xl md:text-4xl font-extrabold max-w-xl leading-tight">
                Ready to Accelerate Your Career Success?
              </h2>
              <p className="text-gray-400 text-sm md:text-base max-w-lg mt-4 leading-relaxed">
                Don't leave your hiring potential to luck. Evaluate alignments, rewrite resume details, and prepare answers instantly.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
                <button
                  onClick={() => navigate('/analyze')}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
                >
                  Scan My Resume Now <FiArrowRight />
                </button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Home;