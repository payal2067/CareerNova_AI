import React, { useState } from 'react';
import { FiUploadCloud, FiFileText, FiCpu, FiCheckCircle, FiAlertTriangle, FiArrowRight, FiTrash2, FiX } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../config/ApiConfig';
import html2pdf from 'html2pdf.js';

// Helper to dynamically load pdf.js from CDN
const loadPdfJs = async () => {
  if (window.pdfjsLib) return window.pdfjsLib;
  return new Promise((resolve, reject) => {
    if (document.getElementById('pdfjs-script')) {
      const checkInterval = setInterval(() => {
        if (window.pdfjsLib) {
          clearInterval(checkInterval);
          resolve(window.pdfjsLib);
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = 'pdfjs-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Helper to dynamically load mammoth.js from CDN
const loadMammoth = async () => {
  if (window.mammoth) return window.mammoth;
  return new Promise((resolve, reject) => {
    if (document.getElementById('mammoth-script')) {
      const checkInterval = setInterval(() => {
        if (window.mammoth) {
          clearInterval(checkInterval);
          resolve(window.mammoth);
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = 'mammoth-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
    script.onload = () => resolve(window.mammoth);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const extractTextFromPdf = async (arrayBuffer) => {
  const pdfjsLib = await loadPdfJs();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
};

const extractTextFromDocx = async (arrayBuffer) => {
  const mammoth = await loadMammoth();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const Analyze = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);

  // File upload and parsing states
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isJdParsing, setIsJdParsing] = useState(false);

  const handleFileChange = async (file) => {
    if (!file) return;

    // Validate file extension
    const fileType = file.name.split('.').pop().toLowerCase();
    if (fileType !== 'pdf' && fileType !== 'docx') {
      setParseError('Unsupported file format. Please upload a PDF or DOCX file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setParseError('File size exceeds the 5MB limit.');
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setUploadedFile(file);

    try {
      const reader = new FileReader();
      const arrayBufferPromise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file.'));
      });
      reader.readAsArrayBuffer(file);
      const arrayBuffer = await arrayBufferPromise;

      let extractedText = '';
      if (fileType === 'pdf') {
        extractedText = await extractTextFromPdf(arrayBuffer);
      } else {
        extractedText = await extractTextFromDocx(arrayBuffer);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No readable text could be extracted from the document.');
      }

      setResumeText(extractedText);
    } catch (err) {
      console.error(err);
      setParseError(err.message || 'An error occurred while parsing the file.');
      setUploadedFile(null);
      setResumeText('');
    } finally {
      setIsParsing(false);
    }
  };

  const handleJdFileChange = async (file) => {
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();
    if (fileType !== 'pdf' && fileType !== 'docx') {
      setParseError('Unsupported JD file format. Please upload a PDF or DOCX file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setParseError('JD file size exceeds the 5MB limit.');
      return;
    }

    setIsJdParsing(true);
    setParseError(null);

    try {
      const reader = new FileReader();
      const arrayBufferPromise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read JD file.'));
      });
      reader.readAsArrayBuffer(file);
      const arrayBuffer = await arrayBufferPromise;

      let extractedText = '';
      if (fileType === 'pdf') {
        extractedText = await extractTextFromPdf(arrayBuffer);
      } else {
        extractedText = await extractTextFromDocx(arrayBuffer);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No readable text could be extracted from the JD document.');
      }

      setJobDescription(extractedText);
    } catch (err) {
      console.error(err);
      setParseError(err.message || 'An error occurred while parsing the JD file.');
    } finally {
      setIsJdParsing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setResumeText('');
    setParseError(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const steps = [
    'Parsing resume structure...',
    'Extracting keywords and skills...',
    'Analyzing target job description...',
    'Performing semantic gap analysis...',
    'Simulating ATS ranking algorithms...',
    'Generating interview preparation guide...'
  ];

  const handleStartAnalysis = async (e) => {
    e.preventDefault();
    if (!uploadedFile || !jobDescription) return;

    setIsAnalyzing(true);
    setStep(0);
    setResult(null);
    setParseError(null);

    // Simulate analysis step transitions for UI UX
    const interval = setInterval(() => {
      setStep((prevStep) => (prevStep < steps.length - 1 ? prevStep + 1 : prevStep));
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('resume', uploadedFile);
      formData.append('job_description', jobDescription);

      const response = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data;

      clearInterval(interval);
      setStep(steps.length);
      setIsAnalyzing(false);

      const resultData = {
        score: data.matchResult?.match_score || 0,
        matchedKeywords: data.matchResult?.matched_keywords || [],
        missingKeywords: data.matchResult?.missing_keywords || [],
        recommendations: data.matchResult?.actionable_suggestions || [],
        jobSuitability: data.matchResult?.job_suitability || 'Unknown',
        jdKeywordsMatched: data.matchResult?.matched_keywords?.length || 0,
        jdKeywordsTotal: (data.matchResult?.matched_keywords?.length || 0) + (data.matchResult?.missing_keywords?.length || 0),
        parsedResume: data.parsedResume || null
      };

      setResult(resultData);

      // Save to localStorage for mock interview customization
      localStorage.setItem("lastResumeAnalysis", JSON.stringify({
        resumeId: data.savedRecordId,
        candidateName: data.parsedResume?.name || "",
        extractedSkills: data.parsedResume?.skills || [],
        experience: data.parsedResume?.experience || [],
        projects: data.parsedResume?.projects || [],
        jobDescription: jobDescription,
        missingKeywords: data.matchResult?.missing_keywords || []
      }));

    } catch (error) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setParseError(error.message || 'An error occurred during AI alignment scan.');
    }
  };

  const handleDownloadPDF = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        nav, footer, #report-action-buttons { display: none !important; }
        main { padding-top: 0 !important; margin-top: 0 !important; }
        body { background-color: #030014 !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
        #resume-report-content { overflow: visible !important; height: auto !important; max-height: none !important; page-break-inside: auto; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      window.print();
      setTimeout(() => document.head.removeChild(style), 1000);
    }, 100);
  };

  return (
    <>
      <div className="min-h-screen bg-[#030014] text-gray-100 flex flex-col bg-grid-pattern relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] radial-glow-purple -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] radial-glow-blue -z-10" />

        <Navbar />

        <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">Resume Analyzer</span>
            </h1>
            <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
              Evaluate your resume against any job description, identify critical keyword gaps, and optimize for Applicant Tracking Systems (ATS).
            </p>
          </div>

          {!result && !isAnalyzing && (
            <form onSubmit={handleStartAnalysis} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Resume Upload/Input */}
                <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col min-h-[380px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2 text-indigo-400">
                      <FiFileText /> 1. Upload Your Resume
                    </h3>
                    {uploadedFile && (
                      <span className="text-xs text-gray-500 font-mono">
                        {resumeText.length} characters extracted
                      </span>
                    )}
                  </div>

                  {/* Error message */}
                  {parseError && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                      <FiAlertTriangle className="flex-shrink-0 text-rose-400" />
                      <span className="flex-grow">{parseError}</span>
                      <button
                        type="button"
                        onClick={() => setParseError(null)}
                        className="ml-auto hover:text-rose-100 font-bold cursor-pointer"
                      >
                        <FiX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Content Panel */}
                  <div className="flex-grow flex flex-col justify-center">
                    {isParsing ? (
                      <div className="flex-grow flex flex-col items-center justify-center p-8 rounded-xl border border-white/10 bg-[#07051a]/40 min-h-[220px]">
                        <div className="w-10 h-10 border-4 border-t-indigo-500 border-r-indigo-400 border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-medium text-gray-300">Extracting content...</p>
                        <p className="text-xs text-gray-500 mt-1">Reading PDF/DOCX structure client-side</p>
                      </div>
                    ) : uploadedFile ? (
                      <div className="flex-grow flex flex-col justify-between p-5 rounded-xl border border-emerald-500/20 bg-[#07051a]/40 min-h-[220px]">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                            <FiCheckCircle className="w-6 h-6 animate-pulse" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {uploadedFile.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatFileSize(uploadedFile.size)} • PDF/DOCX parsed
                            </p>
                            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              Parsed successfully
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-4">
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mb-1">
                            Extracted Content Preview
                          </span>
                          <div className="max-h-[100px] overflow-y-auto p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                            {resumeText.substring(0, 500)}
                            {resumeText.length > 500 && '... [truncated]'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('resume-file-input').click()}
                        className={`flex-grow flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer min-h-[220px] text-center ${isDragging
                          ? 'border-indigo-500 bg-indigo-500/5'
                          : 'border-white/10 bg-[#07051a]/40 hover:bg-[#07051a]/60 hover:border-white/20'
                          }`}
                      >
                        <input
                          id="resume-file-input"
                          type="file"
                          accept=".pdf,.docx"
                          className="hidden"
                          onChange={(e) => handleFileChange(e.target.files[0])}
                        />
                        <FiUploadCloud className={`w-12 h-12 mb-3 transition-transform ${isDragging ? 'scale-110 text-indigo-400' : 'text-gray-500 hover:text-gray-400'}`} />
                        <p className="text-sm font-medium text-gray-300">
                          Drag & drop your resume here, or <span className="text-indigo-400 underline decoration-indigo-400/30 hover:text-indigo-300 font-semibold">browse</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Supports PDF and DOCX formats (Max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Description Input */}
                <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2 text-violet-400">
                      <FiCpu /> 2. Job Description
                    </h3>
                    <div>
                      <input
                        id="jd-file-input"
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={(e) => handleJdFileChange(e.target.files[0])}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('jd-file-input').click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border border-violet-500/20 text-xs font-semibold transition-colors cursor-pointer"
                        disabled={isJdParsing}
                      >
                        {isJdParsing ? (
                          <div className="w-3.5 h-3.5 border-2 border-t-violet-300 border-r-violet-300 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FiUploadCloud />
                        )}
                        {isJdParsing ? 'Extracting...' : 'Upload JD File'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="flex-grow min-h-[300px] w-full bg-[#07051a]/80 text-gray-200 p-4 rounded-xl border border-white/10 focus:outline-none focus:border-violet-500 transition-colors font-mono text-sm resize-none"
                    placeholder="Paste the target job description or role requirements here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    required
                  />
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Matches keywords, seniority levels, and required stack.</span>
                    <span>{jobDescription.length} characters</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={!uploadedFile || !jobDescription}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg btn-shiny cursor-pointer"
                >
                  Start AI Alignment Scan <FiArrowRight />
                </button>
              </div>
            </form>
          )}

          {/* Loading / Processing State */}
          {isAnalyzing && (
            <div className="max-w-2xl mx-auto glass-panel p-8 rounded-2xl border border-white/10 text-center my-12">
              <div className="w-16 h-16 border-4 border-t-indigo-500 border-r-violet-500 border-b-blue-500 border-l-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold text-white mb-2">Analyzing Resume Match</h3>
              <p className="text-gray-400 text-sm mb-6">Our AI is dissecting your credentials against the target role requirements.</p>

              <div className="space-y-3 text-left max-w-md mx-auto">
                {steps.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    {step > idx ? (
                      <FiCheckCircle className="text-emerald-400 flex-shrink-0" />
                    ) : step === idx ? (
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0" />
                    )}
                    <span className={step === idx ? 'text-indigo-400 font-semibold' : step > idx ? 'text-gray-300' : 'text-gray-500'}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Presentation */}
          {result && !isAnalyzing && (
            <div id="resume-report-content" className="space-y-8 animate-fadeIn p-2 bg-transparent">
              {/* Top Score Banner */}
              <div className="glass-panel p-8 rounded-3xl border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="text-center md:text-left">
                  <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">Analysis Complete</span>
                  <h2 className="text-3xl font-extrabold text-white mt-1">ATS Optimization Report</h2>
                  <p className="text-gray-400 text-sm mt-2">Resume suitability score and suggestions updated instantly.</p>
                </div>

                {/* Radial Match Score */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* Decorative Outer Pulsing Circle */}
                    <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping opacity-25"></div>
                    {/* Outer circle track */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className="stroke-white/5 fill-none"
                        strokeWidth="10"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className="stroke-indigo-500 fill-none"
                        strokeWidth="10"
                        strokeDasharray="377"
                        strokeDashoffset={377 - (377 * result.score) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-4xl font-extrabold text-white">{result.score}%</span>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Match</p>
                    </div>
                  </div>
                </div>

                <div className="text-center md:text-left space-y-3">
                  <div>
                    <span className="text-xs text-gray-400 block">Fit Classification</span>
                    <span className="text-xl font-bold text-emerald-400">{result.jobSuitability}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Key Skill Match Rate</span>
                    <span className="text-lg font-semibold text-gray-200">
                      {result.jdKeywordsMatched} / {result.jdKeywordsTotal} Core Terms
                    </span>
                  </div>
                </div>
              </div>

              {/* Extracted Resume Data */}
              {result.parsedResume && (
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <FiFileText /> Extracted Resume Data
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm text-gray-400 uppercase tracking-widest font-semibold mb-2">Candidate Info</h4>
                      <p className="text-lg font-medium text-gray-200">{result.parsedResume.name || 'Not found'}</p>
                      <p className="text-sm text-gray-400">{result.parsedResume.email} • {result.parsedResume.phone}</p>
                      {result.parsedResume.summary && (
                        <p className="text-xs text-gray-400 mt-2 italic border-l-2 border-indigo-500/50 pl-2">{result.parsedResume.summary}</p>
                      )}

                      <h4 className="text-sm text-gray-400 uppercase tracking-widest font-semibold mt-4 mb-2">Skills Extracted</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(result.parsedResume.skills || []).map((skill, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-semibold">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-400 uppercase tracking-widest font-semibold mb-2">Work Experience</h4>
                      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {(result.parsedResume.experience || []).map((exp, i) => (
                          <div key={i} className="border-l-2 border-white/10 pl-3">
                            <p className="text-sm font-semibold text-gray-200">{exp.title}</p>
                            <p className="text-xs text-indigo-300">{exp.company} <span className="text-gray-500 ml-1">({exp.duration})</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Keyword breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-400">
                    <FiCheckCircle /> Matched Skills
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">Great! These skills were detected on your resume and align with the role.</p>
                  <div className="flex flex-wrap gap-2">
                    {result.matchedKeywords.map((kw, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-rose-400">
                    <FiAlertTriangle /> Missing Target Skills
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">Adding these skills will increase your ranking relevance significantly.</p>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((kw, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-semibold">
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-bold mb-4 text-indigo-400">Tailored Resume Adjustments</h3>
                <div className="space-y-4">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div id="report-action-buttons" className="flex flex-col sm:flex-row justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 gap-4">
                <span className="text-sm text-gray-400">Save this report or practice answering questions for this stack?</span>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-sm transition-colors border border-white/10 cursor-pointer"
                  >
                    Download PDF
                  </button>
                  <a
                    href="/interview"
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg text-sm transition-colors text-center"
                  >
                    Go to AI Mock Interview
                  </a>
                </div>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Analyze;
