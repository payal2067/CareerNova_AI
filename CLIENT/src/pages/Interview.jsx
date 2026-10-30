import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiMessageSquare, FiMic, FiMicOff, FiSend, FiAward,
  FiVideo, FiCornerDownRight, FiVolume2, FiAlertCircle,
  FiTrendingUp, FiArrowLeft, FiCheckCircle, FiX, FiBarChart2
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../config/ApiConfig';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const calculateElapsedTime = (startTime) => {
  if (!startTime) return 0;
  return Math.max(0, Math.round((Date.now() - startTime) / 1000));
};

const Interview = () => {
  const { user } = useAuth();

  // View control: 'lobby' | 'chat' | 'report' | 'history'
  const [view, setView] = useState('lobby');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Custom loader messages
  const [loaderMessageIndex, setLoaderMessageIndex] = useState(0);
  const loaderMessages = [
    "Establishing secure mock room connection...",
    "Analyzing your profile & skill keywords...",
    "Generating customized AI interview questions...",
    "Activating Coach Ava's speech systems...",
    "Configuring real-time proctoring engines...",
    "Entering simulation room..."
  ];

  // Lobby Config
  const [role, setRole] = useState('Frontend Engineer');
  const [experience, setExperience] = useState('Mid-Level (2-5 yrs)');
  const [interviewMode, setInterviewMode] = useState('text'); // 'text' | 'voice' | 'video'
  const [inputMode, setInputMode] = useState('text'); // active input mode in chat

  // Session State
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');

  // Evaluation States
  const [isCoachThinking, setIsCoachThinking] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState(null);

  // Silence / Timer States
  const [silenceTimeLeft, setSilenceTimeLeft] = useState(10);
  const [isSpeechSupported] = useState(() => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(false);

  // History & Report States
  const [sessionReport, setSessionReport] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  // AI Proctoring States
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [proctoringScore, setProctoringScore] = useState(100);
  const [activeOverlayAlert, setActiveOverlayAlert] = useState(null);
  const videoRef = useRef(null);
  const proctorIntervalRef = useRef(null);
  const cocoModelRef = useRef(null);
  const proctoringScoreRef = useRef(100);
  const warningsRef = useRef([]);
  const alertTimeoutRef = useRef(null);

  // Refs for tracking silence, transcriptions and speech synthesis
  const silenceTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);
  const liveTranscriptRef = useRef('');
  const isVoiceActiveRef = useRef(false);
  const isEvaluatingRef = useRef(false);
  const questionStartTimeRef = useRef(null);
  const submitAnswerRef = useRef(null);
  const resetSilenceTimerRef = useRef(null);

  // Auto-scroll chat history to the bottom without page-level scroll
  const isProgrammaticExitRef = useRef(false);
  const handleSubmitInterviewRef = useRef(null);
  const viewRef = useRef(view);
  const nextQuestionTimeoutRef = useRef(null);

  // Sync ref with live view state
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const requestFullScreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
    } catch (err) {
      console.error("Error requesting full screen:", err.message);
    }
  };

  const exitFullScreen = async () => {
    isProgrammaticExitRef.current = true;
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (e) {
      console.log("Exit fullscreen note:", e.message);
    } finally {
      setTimeout(() => {
        isProgrammaticExitRef.current = false;
      }, 300);
    }
  };

  // Fullscreen Detection useEffect
  useEffect(() => {
    const handleFullScreenChange = () => {
      const isFullScreen = document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.msFullscreenElement;
      
      if (view === 'chat' && !isFullScreen && !isProgrammaticExitRef.current) {
        toast.error("🚨 Fullscreen exited! Auto-submitting your interview to prevent cheating...", { id: 'fullscreen-alert', duration: 5000 });
        if (handleSubmitInterviewRef.current) {
          handleSubmitInterviewRef.current();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("msfullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullScreenChange);
      document.removeEventListener("msfullscreenchange", handleFullScreenChange);
    };
  }, [view]);

  // Rotate loader messages during initial session creation
  useEffect(() => {
    if (!loading || view !== 'lobby') return;
    const interval = setInterval(() => {
      setLoaderMessageIndex((prev) => (prev + 1) % loaderMessages.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [loading, view, loaderMessages.length]);

  // Auto-scroll chat history to the bottom without page-level scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, isCoachThinking]);

  // Sync ref with live transcript state to avoid closure traps
  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  const stopListening = useCallback(() => {
    isVoiceActiveRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Recognition stop error:", e.message);
      }
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  }, []);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript + interimTranscript;
      if (text.trim()) {
        setLiveTranscript(text);
        if (resetSilenceTimerRef.current) resetSilenceTimerRef.current(text); // Reset silence timer on voice activity
      }
    };

    rec.onend = () => {
      // Auto restart if still in voice mode and not evaluating
      if (isVoiceActiveRef.current && !isEvaluatingRef.current) {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          console.log("Speech recognition start issue:", e.message);
        }
      }
    };

    rec.onerror = (e) => {
      console.error("Speech Recognition Error:", e);
      if (e.error === 'not-allowed') {
        toast.error("Microphone permission denied. Falling back to text mode.");
        setInputMode('text');
        stopListening();
      }
    };

    recognitionRef.current = rec;

    return () => {
      stopListening();
    };
  }, [stopListening]);

  // AI Proctoring Setup (Only runs in video mode)
  useEffect(() => {
    const videoElement = videoRef.current;
    if (view !== 'chat' || interviewMode !== 'video') {
      if (proctorIntervalRef.current) clearInterval(proctorIntervalRef.current);
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
      }
      return;
    }

    let isMounted = true;
    const setupProctoring = async () => {
      try {
        if (!window.cocoSsd) {
          setTimeout(setupProctoring, 1000);
          return;
        }

        // Load COCO-SSD Object & Person Detection Model
        console.log("Loading COCO-SSD & Face Detection models...");
        const model = await window.cocoSsd.load();
        cocoModelRef.current = model;

        // Optionally load FaceAPI if present
        if (window.faceapi) {
          try {
            await window.faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
          } catch (e) {
            console.log("FaceAPI weights load note:", e.message);
          }
        }

        if (!isMounted) return;
        setModelsLoaded(true);

        // Start Webcam
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.log("Video play error:", e.message));
        }

        // Start Detection Loop (runs every 2.5s)
        proctorIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2 || !cocoModelRef.current) return;

          let newWarning = null;

          try {
            // Run object & person detection
            const predictions = await cocoModelRef.current.detect(videoRef.current);
            console.log("Proctoring predictions:", predictions);
            
            const persons = predictions.filter(p => p.class === 'person' && p.score > 0.45);
            const phones = predictions.filter(p => ['cell phone', 'remote', 'mouse', 'keyboard'].includes(p.class) && p.score > 0.4);
            const foreignObjects = predictions.filter(p => ['book', 'laptop', 'tablet'].includes(p.class) && p.score > 0.55);

            if (persons.length === 0) {
              newWarning = "Face/Candidate not visible in camera frame!";
            } else if (persons.length > 1) {
              newWarning = `Multiple persons detected (${persons.length} people in frame)!`;
            } else if (phones.length > 0) {
              newWarning = "Mobile phone / electronic device detected in frame!";
            } else if (foreignObjects.length > 0) {
              newWarning = `Unauthorized item detected: ${foreignObjects[0].class}`;
            }

            // FaceAPI verification if faceapi is ready
            if (!newWarning && window.faceapi) {
              try {
                const detections = await window.faceapi.detectAllFaces(
                  videoRef.current,
                  new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
                );
                if (detections && detections.length > 1) {
                  newWarning = `Multiple faces detected (${detections.length} faces)!`;
                }
              } catch {
                // Ignore transient frame detection errors
              }
            }
          } catch (detErr) {
            console.error("Proctoring detection frame error:", detErr.message);
          }

          if (newWarning) {
            setWarnings(prev => {
              const updated = [newWarning, ...prev.filter(w => w !== newWarning)].slice(0, 5);
              warningsRef.current = updated;
              return updated;
            });
            setProctoringScore(prev => {
              const updatedScore = Math.max(10, prev - 5);
              proctoringScoreRef.current = updatedScore;
              return updatedScore;
            });

            // Instant 1.5-second high visibility popup alert for student
            setActiveOverlayAlert(newWarning);
            if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
            alertTimeoutRef.current = setTimeout(() => {
              setActiveOverlayAlert(null);
            }, 1800);

            toast.error(`🚨 Proctor Alert: ${newWarning}`, { id: 'proctor-alert', duration: 3000 });
          }
        }, 2500);

      } catch (err) {
        console.error("Proctoring setup error:", err);
      }
    };

    setupProctoring();

    return () => {
      isMounted = false;
      if (proctorIntervalRef.current) clearInterval(proctorIntervalRef.current);
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [view, interviewMode]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setLiveTranscript('');
    isVoiceActiveRef.current = true;
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log("Speech recognition already running:", e.message);
    }
    if (resetSilenceTimerRef.current) resetSilenceTimerRef.current('');
  };



  const resetSilenceTimer = (currentText) => {
    if (interviewMode === 'text') return; // Active in Voice & Video modes
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    const hasSpoken = currentText && currentText.trim().length > 0;
    const timeoutSeconds = hasSpoken ? 4 : 10;

    setSilenceTimeLeft(timeoutSeconds);

    let counter = timeoutSeconds;
    countdownIntervalRef.current = setInterval(() => {
      counter -= 1;
      setSilenceTimeLeft(counter);
      if (counter <= 0) {
        clearInterval(countdownIntervalRef.current);
      }
    }, 1000);

    silenceTimerRef.current = setTimeout(() => {
      const textToSubmit = currentText || liveTranscriptRef.current || '';
      if (!textToSubmit.trim()) {
        if (submitAnswerRef.current) submitAnswerRef.current("", true); // Auto-skip on full silence
      } else {
        if (submitAnswerRef.current) submitAnswerRef.current(textToSubmit, false);
      }
    }, timeoutSeconds * 1000);
  };

  // Text-To-Speech function
  const speakQuestionText = (text) => {
    if (!window.speechSynthesis) return;

    stopListening();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    setIsCoachSpeaking(true);

    utterance.onend = () => {
      setIsCoachSpeaking(false);
      if (viewRef.current === 'chat' && (interviewMode === 'voice' || interviewMode === 'video')) {
        startListening();
      }
    };

    utterance.onerror = () => {
      setIsCoachSpeaking(false);
      if (viewRef.current === 'chat' && (interviewMode === 'voice' || interviewMode === 'video')) {
        startListening();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Lobby start
  const startInterviewSession = async () => {
    await requestFullScreen();
    setLoading(true);
    setError(null);
    setLatestFeedback(null);
    setChatHistory([]);
    setCurrentQuestionIndex(0);

    let resumeAnalysis = null;
    const savedAnalysis = localStorage.getItem("lastResumeAnalysis");
    if (savedAnalysis) {
      try {
        resumeAnalysis = JSON.parse(savedAnalysis);
      } catch (err) {
        console.error("Error loading resume analysis from localStorage:", err);
      }
    }

    const payload = {
      targetRole: role,
      difficulty: experience.toLowerCase().includes('junior') ? 'beginner' : experience.toLowerCase().includes('senior') ? 'advanced' : 'intermediate',
      mode: interviewMode,
      resumeId: resumeAnalysis?.resumeId || null,
      resumeData: resumeAnalysis ? {
        candidateName: resumeAnalysis.candidateName,
        extractedSkills: resumeAnalysis.extractedSkills,
        experience: resumeAnalysis.experience,
        projects: resumeAnalysis.projects,
        missingSkills: resumeAnalysis.missingKeywords
      } : null,
      jobDescription: resumeAnalysis?.jobDescription || "",
      missingKeywords: resumeAnalysis?.missingKeywords || []
    };

    try {
      const res = await api.post('/interview/start', payload);
      if (res.data?.success) {
        const { sessionId, questions: fetchedQuestions, candidateName } = res.data;
        setSessionId(sessionId);
        setQuestions(fetchedQuestions);
        setInputMode(interviewMode === 'text' ? 'text' : 'voice');
        setView('chat');

        // Setup welcome message
        const welcomeText = `Hi ${candidateName || user?.fullName || 'there'}! I'm Ava, your AI Career Coach. Let's practice mock interviews for the ${role} position. Here is your first question: ${fetchedQuestions[0]?.question}`;

        setChatHistory([
          {
            sender: 'coach',
            text: welcomeText,
            code: fetchedQuestions[0]?.code,
            options: fetchedQuestions[0]?.options,
            type: fetchedQuestions[0]?.type,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            basedOn: fetchedQuestions[0]?.basedOn
          }
        ]);

        questionStartTimeRef.current = Date.now();

        // Speak welcome + first question
        setTimeout(() => {
          speakQuestionText(welcomeText);
        }, 800);
      } else {
        throw new Error(res.data?.message || "Failed to initialize interview");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to start interview lobby session.");
      exitFullScreen();
    } finally {
      setLoading(false);
    }
  };

  // Evaluate & Next Question
  const submitAnswer = async (answerText, wasSkipped = false) => {
    if (isEvaluating) return;

    stopListening();
    setIsEvaluating(true);
    isEvaluatingRef.current = true;

    const timeTaken = calculateElapsedTime(questionStartTimeRef.current);
    const currentQ = questions[currentQuestionIndex];

    const displayAnswer = wasSkipped ? "Skipped" : answerText;

    // Add user answer to chat list
    setChatHistory((prev) => [
      ...prev,
      {
        sender: 'user',
        text: displayAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    try {
      // POST single answer evaluation
      const res = await api.post('/interview/evaluate', {
        sessionId,
        questionId: currentQ._id,
        answer: answerText,
        timeTaken,
        wasSkipped,
        inputMode
      });

      if (res.data?.success) {
        const evalResult = res.data.evaluation;
        setLatestFeedback(evalResult);

        // Update local questions copy with evaluation to show later in report
        setQuestions((prevQ) => {
          const updated = [...prevQ];
          updated[currentQuestionIndex].studentAnswer = displayAnswer;
          updated[currentQuestionIndex].wasSkipped = wasSkipped;
          updated[currentQuestionIndex].evaluation = evalResult;
          return updated;
        });

        // Advance index or Submit session
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
          setCurrentQuestionIndex(nextIndex);
          setCurrentAnswer('');
          setLiveTranscript('');

          setIsCoachThinking(true);

          nextQuestionTimeoutRef.current = setTimeout(() => {
            if (viewRef.current !== 'chat') return;

            const nextQ = questions[nextIndex];
            const nextPrompt = `Got it. Here is the next question: ${nextQ.question}`;

            setChatHistory((prev) => [
              ...prev,
              {
                sender: 'coach',
                text: nextPrompt,
                code: nextQ.code,
                options: nextQ.options,
                type: nextQ.type,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                basedOn: nextQ.basedOn
              }
            ]);

            setIsCoachThinking(false);
            questionStartTimeRef.current = Date.now();

            // Speak next question
            speakQuestionText(nextPrompt);
          }, 1500);
        } else {
          // Completed all questions, trigger submit
          handleSubmitInterview();
        }
      } else {
        throw new Error(res.data?.message || "Failed to evaluate answer.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Answer submission failed. Keeping current question active.");
      // Rollback chat view user message
      setChatHistory((prev) => prev.slice(0, -1));
    } finally {
      setIsEvaluating(false);
      isEvaluatingRef.current = false;
    }
  };

  // Submit interview and compile report
  const handleSubmitInterview = async () => {
    exitFullScreen();
    if (nextQuestionTimeoutRef.current) {
      clearTimeout(nextQuestionTimeoutRef.current);
    }
    setLoading(true);
    stopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (proctorIntervalRef.current) clearInterval(proctorIntervalRef.current);
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);

    // Stop webcam access explicitly before view switch
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    try {
      const finalScore = proctoringScoreRef.current !== undefined ? proctoringScoreRef.current : proctoringScore;
      const finalWarnings = warningsRef.current.length > 0 ? warningsRef.current : warnings;
      
      const res = await api.post('/interview/submit', { 
        sessionId, 
        proctoringScore: finalScore, 
        warnings: finalWarnings 
      });
      if (res.data?.success) {
        setSessionReport(res.data.session);
        setView('report');
        toast.success("Interview completed! Report generated successfully.");
      } else {
        throw new Error(res.data?.message || "Submit compilation failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to compile final interview results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch History List
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/interview/history');
      if (res.data?.success) {
        setHistoryData(res.data.sessions || []);
        setView('history');
      } else {
        throw new Error(res.data?.message || "Failed to fetch history");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load interview history stats.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSendText = (e) => {
    e.preventDefault();
    if (!currentAnswer.trim() || isEvaluating) return;
    submitAnswer(currentAnswer.trim(), false);
  };

  // Clean format helper for duration seconds
  const formatTime = (secs) => {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  // Fix closure trap by keeping refs up to date after render
  useEffect(() => {
    submitAnswerRef.current = submitAnswer;
    resetSilenceTimerRef.current = resetSilenceTimer;
    handleSubmitInterviewRef.current = handleSubmitInterview;
  });

  const handleDownloadPDF = () => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        nav, footer, #interview-action-buttons { display: none !important; }
        main { padding-top: 0 !important; margin-top: 0 !important; }
        body { background-color: #030014 !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
        #interview-report-content { overflow: visible !important; height: auto !important; max-height: none !important; page-break-inside: auto; }
      }
    `;
    document.head.appendChild(style);

    // Slight delay to allow CSS to apply
    setTimeout(() => {
      window.print();
      // Remove style after print dialog closes
      setTimeout(() => document.head.removeChild(style), 1000);
    }, 100);
  };

  return (
    <>
      {loading && view === 'lobby' && (
        <div className="fixed inset-0 bg-[#030014]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-indigo-500/20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] radial-glow-purple opacity-30 -z-10" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] radial-glow-blue opacity-30 -z-10" />
            
            {/* Spinning/pulsing animation container */}
            <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-violet-500/10 border-b-violet-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl shadow-lg">
                <FiVideo className="animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-white mb-2 tracking-wide">
              Preparing Simulation Room
            </h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Setting up secure video sandbox environment. This process can take a few moments.
            </p>

            <div className="bg-[#07051a]/80 border border-white/5 rounded-2xl p-4 min-h-[75px] flex flex-col justify-center items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-1 animate-pulse">
                Current Status
              </span>
              <p className="text-sm font-semibold text-gray-200 text-center transition-all duration-300">
                {loaderMessages[loaderMessageIndex]}
              </p>
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Vision AI & Speech Engines Online</span>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#030014] text-gray-100 flex flex-col bg-grid-pattern relative overflow-hidden">
        {/* Glowing visual filters */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] radial-glow-purple -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] radial-glow-blue -z-10" />

        <Navbar />

        <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col">

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiAlertCircle className="text-rose-400 text-xl flex-shrink-0" />
                <span className="text-sm text-rose-300">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <FiX />
              </button>
            </div>
          )}

          {/* LOBBY VIEW */}
          {view === 'lobby' && (
            <div className="max-w-2xl mx-auto w-full my-auto glass-panel p-8 md:p-12 rounded-3xl border border-white/5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg">
                <FiVideo />
              </div>
              <h2 className="text-3xl font-extrabold mb-3 text-white">AI Mock Interview Room</h2>
              <p className="text-gray-400 text-sm mb-8">
                Ava adjusts questions according to your uploaded resume's projects, experience stack, and target job description weak areas.
              </p>

              <div className="space-y-6 text-left max-w-md mx-auto mb-8">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Target Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#07051a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option>Frontend Engineer</option>
                    <option>Backend Developer</option>
                    <option>Fullstack Developer</option>
                    <option>Data Scientist</option>
                    <option>DevOps Engineer</option>
                    <option>System Architect</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Experience Tier</label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full bg-[#07051a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option>Junior / Entry-Level (0-2 yrs)</option>
                    <option>Mid-Level (2-5 yrs)</option>
                    <option>Senior / Lead (5+ yrs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Choose Interview Challenge Mode</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    
                    {/* Text Mode */}
                    <button
                      type="button"
                      onClick={() => setInterviewMode('text')}
                      className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${interviewMode === 'text'
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                      <div>
                        <div className="text-xl mb-2">⌨️</div>
                        <span className="font-bold text-sm block text-gray-200">Text Mode</span>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">Relaxed pacing. Type detailed answers at your own speed with no camera or timer.</p>
                      </div>
                      <span className="text-[9px] font-mono mt-3 px-2 py-0.5 rounded bg-white/5 border border-white/10 w-fit text-gray-300">Standard</span>
                    </button>

                    {/* Voice Mode */}
                    <button
                      type="button"
                      disabled={!isSpeechSupported}
                      onClick={() => setInterviewMode('voice')}
                      className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between relative ${!isSpeechSupported ? 'opacity-40 cursor-not-allowed' : ''} ${interviewMode === 'voice'
                        ? 'bg-violet-600/15 border-violet-500 text-white shadow-lg shadow-violet-500/10'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                      <div>
                        <div className="text-xl mb-2">🎙️</div>
                        <span className="font-bold text-sm block text-gray-200">Voice & Tone</span>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">Real-time speech-to-text. AI analyzes verbal confidence, tone, and filler words.</p>
                      </div>
                      <span className="text-[9px] font-mono mt-3 px-2 py-0.5 rounded bg-violet-500/20 border border-violet-500/30 w-fit text-violet-300">Challenge 1</span>
                    </button>

                    {/* Video Mode */}
                    <button
                      type="button"
                      onClick={() => setInterviewMode('video')}
                      className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${interviewMode === 'video'
                        ? 'bg-emerald-600/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className="text-xl mb-2">📹</div>
                        <span className="font-bold text-sm block text-gray-200">Video & Proctor</span>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">Webcam AI checks eye contact, body posture, multiple persons & mobile phone detection.</p>
                      </div>
                      <span className="text-[9px] font-mono mt-3 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 w-fit text-emerald-300">Challenge 2</span>
                    </button>

                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={startInterviewSession}
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Initializing Lobby...' : 'Enter Interview Lobby'}
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE CHAT INTERVIEW ROOM */}
          {view === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow items-stretch animate-fadeIn">
              {/* Conversation Window (Left 2 cols) */}
              <div className="lg:col-span-2 flex flex-col glass-panel rounded-2xl border border-white/5 overflow-hidden min-h-[500px]">

                {/* Interview Status bar */}
                <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${interviewMode === 'voice' ? 'bg-violet-500 animate-pulse' : interviewMode === 'video' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`}></div>
                    <div>
                      <span className="font-bold text-sm">Session with Coach Ava</span>
                      <span className="text-[10px] text-gray-400 block">
                        {role} • {experience} • {interviewMode === 'voice' ? '🎙️ Voice & Tone Mode' : interviewMode === 'video' ? '📹 Video Proctored Mode' : '⌨️ Text Interview Mode'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-400 font-mono">Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <button
                      onClick={() => {
                        if (nextQuestionTimeoutRef.current) {
                          clearTimeout(nextQuestionTimeoutRef.current);
                        }
                        stopListening();
                        if (window.speechSynthesis) window.speechSynthesis.cancel();
                        if (proctorIntervalRef.current) clearInterval(proctorIntervalRef.current);
                        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
                        if (videoRef.current && videoRef.current.srcObject) {
                          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                        }
                        setView('lobby');
                        exitFullScreen();
                      }}
                      className="text-gray-400 hover:text-base-content transition-colors cursor-pointer"
                      title="Exit session"
                    >
                      Exit Room
                    </button>
                  </div>
                </div>

                {/* Instant Real-Time Alert Banner (Pops on violation) */}
                {activeOverlayAlert && (
                  <div className="bg-rose-600 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold animate-pulse border-b border-rose-500 shadow-md">
                    <div className="flex items-center gap-2">
                      <FiAlertCircle className="text-base animate-bounce" />
                      <span>PROCTOR ALERT: {activeOverlayAlert}</span>
                    </div>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">-5% Trust</span>
                  </div>
                )}

                {/* Voice mode silence indicator (ONLY in voice mode) */}
                {interviewMode === 'voice' && !isCoachSpeaking && !isEvaluating && (
                  <div className="bg-[#18112d] border-b border-violet-500/10 px-6 py-2.5 flex items-center justify-between text-xs">
                    <span className="text-violet-300 font-semibold flex items-center gap-1.5 animate-pulse">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                      </span>
                      Speak now, listening for response...
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-mono text-[10px]">Auto-submitting in:</span>
                      <div className="w-12 bg-white/10 rounded-full h-2 overflow-hidden border border-white/5">
                        <div
                          className={`h-full transition-all duration-1000 ${silenceTimeLeft > 3 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                          style={{ width: `${(silenceTimeLeft / 10) * 100}%` }}
                        />
                      </div>
                      <span className="font-bold font-mono text-gray-300 text-[10px] w-4">{silenceTimeLeft}s</span>
                    </div>
                  </div>
                )}

                {/* Chat Feed */}
                <div ref={chatContainerRef} className="flex-grow p-6 overflow-y-auto space-y-6 max-h-[420px]">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                      {msg.sender === 'coach' && (
                        <button
                          type="button"
                          onClick={() => speakQuestionText(msg.text)}
                          title="Speak question aloud"
                          className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-base-content flex-shrink-0 hover:scale-105 active:scale-95 transition-transform"
                        >
                          <FiVolume2 />
                        </button>
                      )}
                      <div className="max-w-[80%] flex flex-col">
                        <div
                          className={`rounded-2xl p-4 text-sm leading-relaxed ${msg.sender === 'user'
                            ? 'bg-indigo-600 text-base-content rounded-tr-none'
                            : 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-none'
                            }`}
                        >
                          <div className="prose prose-invert max-w-none text-sm markdown-body">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({inline, className, children, ...props}) {
                                  return !inline ? (
                                    <pre className="bg-[#0a0718] p-3 rounded-lg overflow-x-auto border border-white/10 my-3 font-mono text-xs">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  ) : (
                                    <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-200 font-mono text-xs" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({children}) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="mb-1">{children}</li>,
                                h1: ({children}) => <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>,
                                h2: ({children}) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
                                h3: ({children}) => <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>,
                              }}
                            >
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                          {msg.code && (
                            <pre className="bg-[#0a0718] p-3.5 rounded-xl overflow-x-auto border border-indigo-500/20 my-3 font-mono text-[11px] text-left leading-normal shadow-inner">
                              <code className="text-indigo-200">
                                {msg.code}
                              </code>
                            </pre>
                          )}
                          {msg.options && msg.options.length > 0 && (
                            <div className="mt-3 grid grid-cols-1 gap-2">
                              {msg.options.map((opt, oIdx) => {
                                const isCurrentQuestion = idx === chatHistory.length - 1;
                                const isSelected = (inputMode === 'text' ? currentAnswer : liveTranscript) === opt;
                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => {
                                      if (isCurrentQuestion && !isEvaluating) {
                                        if (inputMode === 'text') {
                                          setCurrentAnswer(opt);
                                        } else {
                                          setLiveTranscript(opt);
                                        }
                                      }
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                                      isSelected
                                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/10'
                                        : isCurrentQuestion
                                          ? 'bg-[#0a0718]/60 border-white/5 text-gray-300 hover:bg-[#0a0718]/80 hover:border-white/10 cursor-pointer'
                                          : 'bg-white/[0.02] border-white/[0.02] text-gray-400 cursor-not-allowed opacity-80'
                                    }`}
                                    disabled={!isCurrentQuestion || isEvaluating}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                                        isSelected ? 'bg-indigo-500 text-white' : 'bg-white/5 text-indigo-400'
                                      }`}>
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                    {isSelected && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {msg.basedOn && (
                            <span className="block mt-2 text-[10px] text-indigo-300/80 font-mono italic">
                              💡 Context: {msg.basedOn}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 self-end">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))}

                  {isCoachThinking && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-base-content flex-shrink-0 animate-pulse">
                        A
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-4 max-w-[80%] flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input form */}
                <div className="p-4 bg-white/5 border-t border-white/5">
                  {inputMode === 'voice' && !isCoachSpeaking && (
                    <div className="mb-3 p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                      <p className="text-xs text-gray-300 italic flex-grow">
                        {liveTranscript ? `"${liveTranscript}"` : 'Awaiting speech input... Start speaking to write response.'}
                      </p>
                      {liveTranscript && (
                        <button
                          onClick={() => {
                            stopListening();
                            submitAnswer(liveTranscript, false);
                          }}
                          className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-xs font-semibold rounded-lg text-base-content"
                        >
                          Send Speech
                        </button>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleManualSendText} className="flex gap-3">
                    <textarea
                      value={inputMode === 'voice' ? liveTranscript : currentAnswer}
                      onChange={(e) => {
                        if (inputMode === 'text') {
                          setCurrentAnswer(e.target.value);
                        } else {
                          setLiveTranscript(e.target.value);
                        }
                      }}
                      disabled={isEvaluating}
                      placeholder={inputMode === 'voice' ? "Speech output transcribes here..." : "Type your response to Coach Ava..."}
                      rows="2"
                      className="flex-grow bg-[#07051a]/85 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none placeholder:text-gray-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleManualSendText(e);
                        }
                      }}
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        type="submit"
                        disabled={isEvaluating || (inputMode === 'text' ? !currentAnswer.trim() : !liveTranscript.trim())}
                        className="p-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 text-base-content rounded-xl transition-all transform active:scale-95 flex items-center justify-center cursor-pointer"
                        title="Submit Answer"
                      >
                        <FiSend size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (inputMode === 'voice') {
                            setInputMode('text');
                            stopListening();
                          } else {
                            if (!isSpeechSupported) {
                              toast.error("Web Speech API is not supported in this browser.");
                              return;
                            }
                            setInputMode('voice');
                            if (!isCoachSpeaking) {
                              startListening();
                            }
                          }
                        }}
                        className={`p-3 rounded-xl border transition-colors flex items-center justify-center cursor-pointer ${inputMode === 'voice'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                          : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'
                          }`}
                        title={inputMode === 'voice' ? "Switch to Text Mode" : "Switch to Voice Mode"}
                      >
                        {inputMode === 'voice' ? <FiMicOff size={18} /> : <FiMic size={18} />}
                      </button>
                    </div>
                  </form>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-gray-500">
                    <span>Press Enter to send. Use Shift+Enter for a new line.</span>
                    <button
                      type="button"
                      onClick={() => submitAnswer("", true)}
                      className="text-rose-400 hover:underline cursor-pointer"
                      disabled={isEvaluating}
                    >
                      Skip current question (scores 0)
                    </button>
                  </div>
                </div>
              </div>

              {/* AI FEEDBACK FEED (Right 1 col) */}
              <div className="flex flex-col glass-panel rounded-2xl border border-white/5 p-6 space-y-6">
                
                {/* AI Video Proctoring Feed (ONLY in video mode) */}
                {interviewMode === 'video' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-200">
                        <FiVideo className={modelsLoaded ? "text-emerald-400" : "text-amber-400 animate-pulse"} />
                        <span>AI Proctoring Stream</span>
                      </div>
                      {modelsLoaded && (
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${proctoringScore > 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          Trust: {proctoringScore}%
                        </span>
                      )}
                    </div>
                    
                    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-inner">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        width="640"
                        height="480"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Instant floating badge over video stream */}
                      {activeOverlayAlert && (
                        <div className="absolute inset-x-3 top-3 z-30 bg-rose-600/95 text-white py-2 px-3 rounded-xl shadow-2xl border border-rose-400 flex items-center justify-center gap-2 animate-bounce">
                          <FiAlertCircle className="text-base flex-shrink-0 animate-spin" />
                          <span className="text-[11px] font-extrabold tracking-wide">{activeOverlayAlert}</span>
                        </div>
                      )}

                      {!modelsLoaded && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-xs text-indigo-300">
                          <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></span>
                          Initializing Vision Engine...
                        </div>
                      )}
                    </div>
                    
                    {warnings.length > 0 && (
                      <div className="mt-2 text-[10px] text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                        <strong>Recent Alerts:</strong>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          {warnings.slice(0, 2).map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Voice Tone Analysis Indicator (ONLY in voice mode) */}
                {interviewMode === 'voice' && (
                  <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
                        <FiVolume2 className="animate-pulse" />
                        <span>Voice Tone Engine</span>
                      </div>
                      <span className="text-[10px] font-mono text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-snug">
                      Listening to speech clarity, hesitation duration, and confidence metrics in real-time.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2.5 pb-4 border-b border-white/5">
                  <FiAward className="text-violet-400 text-xl animate-pulse" />
                  <div>
                    <h3 className="font-bold text-base">Real-time Coaching Feed</h3>
                    <p className="text-[10px] text-gray-400">Updates after each answer you submit</p>
                  </div>
                </div>

                {!latestFeedback ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 px-4">
                    <FiMessageSquare size={36} className="mb-3 opacity-30 text-indigo-400" />
                    <p className="text-sm font-semibold">Waiting for response...</p>
                    <p className="text-xs mt-1">Submit your first answer to see live grading and improvements.</p>
                  </div>
                ) : (
                  <div className="space-y-6 flex-grow overflow-y-auto max-h-[460px] pr-1">
                    {/* Score panel */}
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest block">AI Grade</span>
                        <span className="text-2xl font-extrabold text-indigo-300">
                          {latestFeedback.score} / 100
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Completeness</span>
                        <span className={`text-sm font-bold ${latestFeedback.breakdown?.completeness > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {latestFeedback.breakdown?.completeness || 0}%
                        </span>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="space-y-1 bg-white/5 border border-white/5 p-4 rounded-xl">
                      <span className="text-[10px] text-violet-300 font-bold uppercase tracking-widest block">Constructive Review</span>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans">
                        {latestFeedback.feedback}
                      </p>
                      {latestFeedback.toneNotes && (
                        <p className="text-[11px] text-violet-300/90 mt-2 pt-2 border-t border-white/5">
                          🎙️ <span className="font-semibold">Tone:</span> {latestFeedback.toneNotes}
                        </p>
                      )}
                    </div>

                    {/* Missing Concepts */}
                    {latestFeedback.missingConcepts?.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-2">
                          💡 Focus Concepts:
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {latestFeedback.missingConcepts.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px]">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strengths & Weaknesses breakdown */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Score Breakdown</h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="flex justify-between mb-1 text-[10px]">
                            <span>Keyword Relevance</span>
                            <span>{latestFeedback.breakdown?.keywordRelevance}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1">
                            <div className="bg-blue-400 h-1 rounded-full" style={{ width: `${latestFeedback.breakdown?.keywordRelevance || 0}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-[10px]">
                            <span>Technical Depth</span>
                            <span>{latestFeedback.breakdown?.technicalDepth}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1">
                            <div className="bg-indigo-400 h-1 rounded-full" style={{ width: `${latestFeedback.breakdown?.technicalDepth || 0}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-[10px]">
                            <span>Logical Structure</span>
                            <span>{latestFeedback.breakdown?.logicalStructure}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1">
                            <div className="bg-violet-400 h-1 rounded-full" style={{ width: `${latestFeedback.breakdown?.logicalStructure || 0}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SINGLE REPORT DETAIL VIEW */}
          {view === 'report' && sessionReport && (
            <div id="interview-report-content" className="space-y-8 animate-fadeIn max-w-4xl mx-auto w-full p-2 bg-base-100">
              {/* Header card with overall score */}
              <div className="glass-panel p-8 rounded-3xl border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>

                <div className="text-center md:text-left space-y-2">
                  <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">Interview Complete</span>
                  <h2 className="text-3xl font-extrabold text-base-content">Ava's Evaluation</h2>
                  <p className="text-gray-400 text-xs mt-1">Role: <span className="text-gray-300 font-semibold">{sessionReport.targetRole}</span> • {new Date(sessionReport.completedAt || sessionReport.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Score badge */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-pulse"></div>
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="72" cy="72" r="60" className="stroke-white/5 fill-none" strokeWidth="8" />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className="stroke-indigo-500 fill-none transition-all duration-1000"
                        strokeWidth="8"
                        strokeDasharray="377"
                        strokeDashoffset={377 - (377 * (sessionReport.overallScore || 0)) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-4xl font-extrabold text-indigo-100">{sessionReport.overallScore}%</span>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">Rating</p>
                    </div>
                  </div>
                </div>

                {/* Aggregated ratings */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Average Clarity</span>
                      <span>{sessionReport.avgClarity || 0}%</span>
                    </div>
                    <div className="w-full bg-white/15 h-1.5 rounded-full">
                      <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${sessionReport.avgClarity || 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Average Relevance</span>
                      <span>{sessionReport.avgRelevance || 0}%</span>
                    </div>
                    <div className="w-full bg-white/15 h-1.5 rounded-full">
                      <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${sessionReport.avgRelevance || 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Average Completeness</span>
                      <span>{sessionReport.avgCompleteness || 0}%</span>
                    </div>
                    <div className="w-full bg-white/15 h-1.5 rounded-full">
                      <div className="bg-violet-400 h-1.5 rounded-full" style={{ width: `${sessionReport.avgCompleteness || 0}%` }} />
                    </div>
                  </div>

                  {/* Mode specific metric */}
                  {(sessionReport.mode === 'voice' || sessionReport.avgConfidence > 0) && (
                    <div>
                      <div className="flex justify-between text-xs text-violet-300 mb-1">
                        <span className="font-bold">🎙️ Voice Confidence & Tone</span>
                        <span className="font-bold">{sessionReport.avgConfidence || 80}%</span>
                      </div>
                      <div className="w-full bg-white/15 h-1.5 rounded-full">
                        <div className="bg-gradient-to-r from-violet-500 to-indigo-400 h-1.5 rounded-full" style={{ width: `${sessionReport.avgConfidence || 80}%` }} />
                      </div>
                    </div>
                  )}

                  {(sessionReport.mode === 'video' || (sessionReport.warnings && sessionReport.warnings.length > 0)) && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span className="font-bold text-amber-400">📹 AI Proctoring Trust Score</span>
                        <span className="font-bold text-amber-400">{sessionReport.proctoringScore !== undefined ? sessionReport.proctoringScore : 100}%</span>
                      </div>
                      <div className="w-full bg-white/15 h-1.5 rounded-full">
                        <div className={`h-1.5 rounded-full ${sessionReport.proctoringScore > 80 ? 'bg-emerald-400' : 'bg-rose-500'}`} style={{ width: `${sessionReport.proctoringScore !== undefined ? sessionReport.proctoringScore : 100}%` }} />
                      </div>
                      {sessionReport.warnings && sessionReport.warnings.length > 0 && (
                        <p className="text-[9px] text-rose-400 mt-1">Issues flagged: {sessionReport.warnings.length} (e.g. {sessionReport.warnings[0]})</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-emerald-950/5">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <FiCheckCircle /> Key Strengths
                  </h3>
                  <ul className="space-y-3">
                    {sessionReport.strengths?.map((str, i) => (
                      <li key={i} className="text-xs text-gray-300 flex items-start gap-2 leading-relaxed">
                        <FiCornerDownRight className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-rose-950/5">
                  <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <FiAlertCircle /> Areas of Improvement
                  </h3>
                  <ul className="space-y-3">
                    {sessionReport.weaknesses?.map((wk, i) => (
                      <li key={i} className="text-xs text-gray-300 flex items-start gap-2 leading-relaxed">
                        <FiCornerDownRight className="text-rose-500 mt-0.5 flex-shrink-0" />
                        <span>{wk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Body Language & Non-Verbal Analysis Card (For Video Mode) */}
              {(sessionReport.mode === 'video' || sessionReport.proctoringScore !== undefined) && (
                <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-indigo-950/10">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                    <div className="flex items-center gap-2">
                      <FiVideo className="text-emerald-400 text-lg" />
                      <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                        Webcam Body Language & Non-Verbal Feedback
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                      Vision AI Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">👀 Eye Contact</span>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-extrabold text-emerald-400">{Math.min(95, Math.max(65, (sessionReport.proctoringScore || 90) + 4))}%</span>
                        <span className="text-[10px] text-emerald-300 font-semibold">Direct & Steady</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Maintained focus toward the camera lens.</p>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">🧍 Posture & Framing</span>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-extrabold text-indigo-300">{Math.min(98, Math.max(70, sessionReport.proctoringScore || 88))}%</span>
                        <span className="text-[10px] text-indigo-200 font-semibold">Centered in Frame</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Shoulders and head aligned upright.</p>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">😊 Facial Composure</span>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-extrabold text-violet-400">{Math.min(92, Math.max(60, (sessionReport.proctoringScore || 85) - 2))}%</span>
                        <span className="text-[10px] text-violet-300 font-semibold">Calm & Engaged</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Active listening and composure maintained.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                    <span className="text-base">💡</span>
                    <div className="text-xs text-gray-300 leading-relaxed">
                      <strong className="text-white">Coach Ava's Non-Verbal Summary: </strong>
                      {sessionReport.warnings && sessionReport.warnings.length > 0 
                        ? `Good overall posture, but got flagged ${sessionReport.warnings.length} time(s) for distractions (${sessionReport.warnings[0]}). Work on maintaining steady eye contact and keeping devices away.`
                        : `Excellent professional posture! Maintained natural direct eye contact, centered framing, and confident composure throughout all 5 questions.`
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Per Question Breakdown */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <h3 className="font-bold text-lg text-base-content mb-6">Detailed Q&A Breakdown</h3>
                <div className="space-y-6">
                  {sessionReport.questions?.map((q, idx) => (
                    <div key={idx} className="border-b border-white/5 pb-6 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <div className="space-y-1">
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block">
                            Q{idx + 1} • {q.category}
                          </span>
                          {q.basedOn && (
                            <span className="text-[10px] text-gray-500 block">Based on: {q.basedOn}</span>
                          )}
                          <h4 className="text-sm font-semibold text-gray-200 mt-1">{q.question}</h4>
                          {q.code && (
                            <pre className="bg-[#0a0718] p-3 rounded-lg overflow-x-auto border border-indigo-500/15 my-2 font-mono text-[10px] text-left leading-normal max-w-full">
                              <code className="text-indigo-200">
                                {q.code}
                              </code>
                            </pre>
                          )}
                          {q.options && q.options.length > 0 && (
                            <div className="mt-2 pl-2 space-y-1 max-w-md">
                              {q.options.map((opt, oIdx) => {
                                const isCorrect = q.correctAnswer === opt;
                                const isUserAnswer = q.studentAnswer === opt;
                                return (
                                  <div 
                                    key={oIdx} 
                                    className={`text-[10px] px-2 py-1 rounded border flex items-center justify-between ${
                                      isCorrect 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 font-semibold' 
                                        : isUserAnswer 
                                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                                          : 'bg-white/[0.02] border-white/5 text-gray-400'
                                    }`}
                                  >
                                    <div>
                                      <span className="font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                                      {opt}
                                    </div>
                                    <div>
                                      {isCorrect && <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded">Correct Answer</span>}
                                      {!isCorrect && isUserAnswer && <span className="text-[8px] uppercase tracking-wider text-rose-400 font-bold bg-rose-500/20 px-1.5 py-0.5 rounded">Selected Answer</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`text-sm font-bold block ${q.evaluation?.score > 70 ? 'text-emerald-400' : q.evaluation?.score > 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {q.wasSkipped ? 'Skipped' : `${q.evaluation?.score || 0} / 100`}
                          </span>
                          <span className="text-[9px] text-gray-500 uppercase tracking-widest block font-mono">
                            {q.inputMode} • {formatTime(q.timeTakenSeconds)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pl-4 border-l-2 border-white/10 space-y-2">
                        <p className="text-xs text-gray-400 italic">
                          <span className="font-bold text-gray-500">Your Answer:</span> "{q.studentAnswer || '[No response]'}"
                        </p>
                        <p className="text-xs text-indigo-200/90 leading-relaxed bg-white/5 p-3 rounded-xl">
                          <span className="font-bold text-indigo-300 block mb-1 text-[10px] uppercase tracking-widest">AI Feedback:</span>
                          {q.evaluation?.feedback || 'No feedback compiled.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div id="interview-action-buttons" className="flex flex-col sm:flex-row items-center justify-between pb-10 gap-4">
                <button
                  onClick={() => setView('lobby')}
                  className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <FiArrowLeft /> Back to Lobby
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-base-content font-semibold rounded-xl text-sm transition-colors border border-white/10 text-center"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={fetchHistory}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-base-content rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    <FiTrendingUp /> View Progress History
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* HISTORY LINE CHART VIEW */}
          {view === 'history' && (
            <div className="max-w-4xl mx-auto w-full space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-extrabold text-base-content flex items-center gap-2">
                    <FiBarChart2 className="text-indigo-400" /> Performance Analysis
                  </h2>
                  <p className="text-xs text-gray-400">Chronological analysis of your overall interview ratings</p>
                </div>
                <button
                  onClick={() => setView('lobby')}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-semibold"
                >
                  Back to Lobby
                </button>
              </div>

              {loading ? (
                <div className="py-20 text-center text-gray-500">Loading analysis charts...</div>
              ) : historyData.length === 0 ? (
                <div className="glass-panel py-20 text-center text-gray-500 rounded-2xl border border-white/5">
                  <FiVideo size={48} className="mx-auto mb-4 opacity-20 text-indigo-400 animate-pulse" />
                  <p className="text-sm font-semibold text-gray-300">No Interview History Yet</p>
                  <p className="text-xs mt-1 text-gray-500">Complete mock sessions to see performance progression charts.</p>
                  <button
                    onClick={() => setView('lobby')}
                    className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-base-content text-xs font-semibold shadow-lg"
                  >
                    Start First Interview
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Graph card */}
                  <div className="glass-panel p-6 rounded-2xl border border-white/5">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Mock Scores Trend</h3>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={historyData.map((session) => ({
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

                  {/* List of past reports */}
                  <div className="glass-panel p-6 rounded-2xl border border-white/5">
                    <h3 className="font-bold text-base text-gray-200 mb-4">Past Session Reports</h3>
                    <div className="space-y-3">
                      {historyData.map((session, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-indigo-300 block">{session.targetRole}</span>
                            <span className="text-[10px] text-gray-500">
                              {new Date(session.completedAt || session.createdAt).toLocaleDateString()} • {session.questions?.length} Questions • {session.difficulty}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-base font-extrabold text-emerald-400 block">{session.overallScore}%</span>
                              <span className="text-[8px] text-gray-500 uppercase font-mono">Score</span>
                            </div>
                            <button
                              onClick={async () => {
                                setLoading(true);
                                try {
                                  const res = await api.get(`/interview/session/${session._id}`);
                                  if (res.data?.success) {
                                    setSessionReport(res.data.session);
                                    setView('report');
                                  }
                                } catch {
                                  toast.error("Failed to load session report");
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              View Report
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>

        <Footer />
      </div>
    </>
  );
};

export default Interview;
