import mongoose from "mongoose";
import axios from "axios";
import InterviewSession from "../models/InterviewSession.js";
import Resume from "../models/resume.model.js";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = (API_KEY) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

const FAST_CONFIG = {
  temperature: 0.4,
  maxOutputTokens: 4096,
  topP: 0.9,
  topK: 40,
  thinkingConfig: { thinkingBudget: 0 }
};

const EVAL_CONFIG = {
  temperature: 0,
  maxOutputTokens: 1024,
  topP: 0.8,
  topK: 20,
  thinkingConfig: { thinkingBudget: 0 }
};

export const startSimulation = async (req, res) => {
  try {
    const { targetRole, difficulty, resumeId, resumeData, jobDescription, missingKeywords, mode } = req.body;
    const userId = req.user?._id || req.user?.id;
    const API_KEY = process.env.GEMINI_API_KEY?.trim();

    let candidateName = "";
    let skills = [];
    let experience = [];
    let projects = [];
    let missingSkills = missingKeywords || [];
    let resumeDetails = null;

    // Fetch resume from DB if resumeId is provided
    if (resumeId) {
      try {
        resumeDetails = await Resume.findById(resumeId);
      } catch (err) {
        console.error("Error fetching resume in startSimulation:", err.message);
      }
    }

    // Fallback to resumeData passed directly
    if (!resumeDetails && resumeData) {
      resumeDetails = resumeData;
    }

    if (resumeDetails) {
      candidateName = resumeDetails.candidateName || resumeDetails.name || "";
      skills = resumeDetails.extractedSkills || resumeDetails.skills || [];
      experience = resumeDetails.experience || [];
      projects = resumeDetails.projects || [];
      if (!missingSkills.length) {
        missingSkills = resumeDetails.missingSkills || resumeDetails.missingKeywords || [];
      }
    }

    const roleStr = targetRole || "Software Developer";
    const skillsStr = skills.length ? skills.join(", ") : "Frontend, Backend, Problem Solving";

    let resumeContext = "";
    if (resumeDetails) {
      resumeContext = `Candidate Profile:\n- Name: ${candidateName}\n- Skills: ${skillsStr}\n`;
      if (projects.length) {
        resumeContext += `- Projects:\n${projects.map((p, i) => `  ${i+1}. ${p.title || p.name || "Project"}: ${p.description || "No description"}`).join("\n")}\n`;
      }
      if (experience.length) {
        resumeContext += `- Experience:\n${experience.map((e, i) => `  ${i+1}. ${e.title} at ${e.company} (${e.duration}): ${e.description || ""}`).join("\n")}\n`;
      }
    }

    let questionsData = [];
    const isTextMode = mode === 'text';

    if (API_KEY) {
      try {
        const questionPrompt = `You are a Senior Technical Hiring Manager conducting a mock interview for the position of "${roleStr}". 
Difficulty level: ${difficulty || "intermediate"}.
${resumeContext ? resumeContext : `Key Skills: ${skillsStr}`}
${jobDescription ? `Job Description:\n"${jobDescription}"\n` : ""}
${missingSkills && missingSkills.length > 0 ? `Weak Areas / Missing Keywords from JD: ${missingSkills.slice(0, 10).join(", ")}\n` : ""}

Generate exactly 5 high-quality interview questions covering:
${isTextMode 
  ? `1. Technical Core (MCQ with 4 options and correctAnswer) - based on candidate's skills or target role.` 
  : `1. Conceptual Technical Question (verbal response) - based on candidate's skills or target role. Do NOT make this an MCQ.`
}
2. Short Answer Technical Question - specifically targeting a weak/missing keyword if any, otherwise candidate skills.
3. Practical Problem Solving / Code Output - matching target difficulty.
4. System Design or Architecture Concept - appropriate for seniority.
5. Behavioral STAR Method Question - project-based or generic.

For each question, specify which skill, project, or weak area it is based on (put this in the "basedOn" field).

Return ONLY a JSON array. Each object format:
[
  {
    "question": "Question text...",
    "category": "Technical" | "Behavioral" | "System Design" | "Project Deep Dive",
    "type": ${isTextMode ? '"mcq" | ' : ''}"short-answer" | "code-output" | "system-design" | "behavioral",
    ${isTextMode ? '"options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctAnswer": "Option A",' : ''}
    "code": "",
    "basedOn": "React / System Design / Weak Area: Docker"
  }
]`;

        console.log(`📡 Generating ${roleStr} interview questions via Gemini AI...`);
        const startTime = Date.now();

        const response = await axios.post(
          GEMINI_URL(API_KEY),
          {
            contents: [{ parts: [{ text: questionPrompt }] }],
            generationConfig: FAST_CONFIG
          },
          { headers: { "Content-Type": "application/json" }, timeout: 60000 }
        );

        console.log(`⚡ Questions generated in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

        const rawText = response.data.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questionsData = JSON.parse(jsonMatch[0]);
        }
      } catch (aiErr) {
        console.error("⚠️ AI Interview Generation Fallback:", aiErr.message);
      }
    }

    // Fallback if AI call failed or no API Key
    if (!questionsData || questionsData.length === 0) {
      questionsData = [
        isTextMode ? {
          question: `For a ${roleStr} role, which data structure provides O(1) average time complexity for key-value lookups?`,
          category: "Technical",
          type: "mcq",
          options: ["Linked List", "Hash Table / Map", "Binary Search Tree", "Array"],
          correctAnswer: "Hash Table / Map",
          basedOn: "Data Structures Core"
        } : {
          question: `For a ${roleStr} role, explain which data structure provides O(1) average time complexity for key-value lookups, and how hashes handle hash collisions.`,
          category: "Technical",
          type: "short-answer",
          basedOn: "Data Structures Core"
        },
        {
          question: `Explain the concept of Asynchronous execution and Event Loop in Javascript. How does it handle non-blocking I/O?`,
          category: "Technical",
          type: "short-answer",
          basedOn: "JavaScript Fundamentals"
        },
        {
          question: `What will be the output of: console.log(typeof NaN); ?`,
          category: "Technical",
          type: "code-output",
          options: ["number", "NaN", "undefined", "object"],
          correctAnswer: "number",
          basedOn: "JavaScript Quirks"
        },
        {
          question: `Design a scalable caching strategy for a high-traffic REST API. Where would you place Redis/Memcached in the architecture?`,
          category: "System Design",
          type: "system-design",
          basedOn: "System Scaling & Performance"
        },
        {
          question: `Describe a scenario where you faced a tough bug in production or a tight deadline. How did you prioritize tasks and communicate with stakeholders?`,
          category: "Behavioral",
          type: "behavioral",
          basedOn: "STAR Method & Problem Solving"
        }
      ];
    }

    // Normalize types & categories & order indices
    questionsData = questionsData.map((q, idx) => ({
      question: q.question || "Interview question",
      category: ["Technical", "Behavioral", "System Design", "Project Deep Dive"].includes(q.category) ? q.category : "Technical",
      type: q.type || "short-answer",
      options: q.options || [],
      correctAnswer: q.correctAnswer || "",
      code: q.code || "",
      basedOn: q.basedOn || "General Domain Knowledge",
      orderIndex: idx
    }));

    const session = await InterviewSession.create({
      userId: userId || new mongoose.Types.ObjectId(),
      targetRole: roleStr,
      skillStack: skills.length ? skills : ["Software Development"],
      difficulty: difficulty || "intermediate",
      mode: mode || "text",
      questions: questionsData,
      status: "in_progress"
    });

    return res.status(200).json({
      success: true,
      sessionId: session._id,
      questions: session.questions,
      candidateName: candidateName
    });
  } catch (error) {
    console.error("Start Simulation Error:", error);
    return res.status(500).json({ success: false, message: "Simulation start failed: " + error.message });
  }
};

export const evaluateAnswer = async (req, res) => {
  try {
    const { sessionId, questionId, answer, timeTaken, wasSkipped, inputMode } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY?.trim();

    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: "Interview session not found" });

    const question = session.questions.id(questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found in session" });

    question.inputMode = inputMode || "text";
    question.timeTakenSeconds = timeTaken || 0;

    // Fast skipped answer evaluation
    if (wasSkipped) {
      question.studentAnswer = "Skipped";
      question.wasSkipped = true;
      question.evaluation = {
        score: 0,
        feedback: "No answer provided — skipped.",
        missingConcepts: [],
        breakdown: {
          keywordRelevance: 0,
          technicalDepth: 0,
          logicalStructure: 0,
          terminologyUsage: 0,
          completeness: 0
        }
      };
      await session.save();
      return res.status(200).json({ success: true, evaluation: question.evaluation });
    }

    question.studentAnswer = answer;
    question.wasSkipped = false;

    // Fast auto-evaluation for MCQ
    if (question.type === "mcq" && question.correctAnswer) {
      const isCorrect = (answer || "").trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
      question.evaluation = {
        score: isCorrect ? 100 : 0,
        feedback: isCorrect ? "Spot on! Correct answer." : `Incorrect. The correct answer is: ${question.correctAnswer}`,
        missingConcepts: isCorrect ? [] : ["Review basic definitions for this concept"],
        breakdown: {
          keywordRelevance: isCorrect ? 100 : 0,
          technicalDepth: isCorrect ? 100 : 0,
          logicalStructure: isCorrect ? 100 : 0,
          terminologyUsage: isCorrect ? 100 : 0,
          completeness: isCorrect ? 100 : 0
        }
      };
      await session.save();
      return res.status(200).json({ success: true, evaluation: question.evaluation });
    }

    // AI Evaluation for Open-Ended / Behavioral / System Design
    if (API_KEY && answer && answer.trim().length > 0) {
      try {
        const isVoice = inputMode === "voice" || session.mode === "voice";
        const evalPrompt = `You are evaluating a candidate's ${isVoice ? "spoken (voice)" : "written"} answer for the position of "${session.targetRole}".

Question (${question.category} / ${question.type}): "${question.question}"
Candidate Answer: "${answer}"
${isVoice ? "Note: This answer was spoken via Speech-To-Text. Evaluate verbal confidence, presence of filler words (e.g., um, uh, like), clarity, and tone." : ""}

Rate the answer out of 100 and provide constructive feedback. Return ONLY this JSON format (no markdown):
{
  "score": <number 0-100>,
  "feedback": "1-2 sentence constructive feedback",
  "missingConcepts": ["concept1", "concept2"],
  "confidenceScore": <number 0-100, measuring verbal/expression confidence and fluency>,
  "toneNotes": "1 short sentence about candidate's tone or delivery assertiveness",
  "breakdown": {
    "keywordRelevance": <number 0-100>,
    "technicalDepth": <number 0-100>,
    "logicalStructure": <number 0-100>,
    "terminologyUsage": <number 0-100>,
    "completeness": <number 0-100>
  }
}`;

        const response = await axios.post(
          GEMINI_URL(API_KEY),
          {
            contents: [{ parts: [{ text: evalPrompt }] }],
            generationConfig: EVAL_CONFIG
          },
          { headers: { "Content-Type": "application/json" }, timeout: 60000 }
        );

        const rawText = response.data.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          question.evaluation = JSON.parse(jsonMatch[0]);
          await session.save();
          return res.status(200).json({ success: true, evaluation: question.evaluation });
        }
      } catch (e) {
        console.error("Single Answer AI Evaluation Fallback:", e.message);
      }
    }

    // Heuristic Fallback
    const lengthScore = Math.min(100, Math.max(30, (answer || "").length * 0.8));
    const isVoice = inputMode === "voice" || session.mode === "voice";
    question.evaluation = {
      score: Math.round(lengthScore),
      feedback: (answer || "").length > 40
        ? "Good attempt! You covered the core point well. Work on adding specific metrics or live project examples."
        : "Your answer was a bit brief. Elaborate with the STAR method (Situation, Task, Action, Result).",
      missingConcepts: ["Specific performance metrics", "Real-world trade-off discussion"],
      confidenceScore: isVoice ? Math.min(95, Math.max(60, Math.round(lengthScore * 0.9))) : 85,
      toneNotes: isVoice ? "Steady pace with good vocal conviction." : "Clear and structured written delivery.",
      breakdown: {
        keywordRelevance: 70,
        technicalDepth: 65,
        logicalStructure: 75,
        terminologyUsage: 70,
        completeness: 60
      }
    };

    await session.save();
    return res.status(200).json({ success: true, evaluation: question.evaluation });
  } catch (error) {
    console.error("Evaluate Answer Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitAnswers = async (req, res) => {
  try {
    const { sessionId, proctoringScore, warnings } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY?.trim();

    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    let totalScore = 0;
    let totalClarity = 0;
    let totalRelevance = 0;
    let totalCompleteness = 0;
    let totalConfidence = 0;
    let totalTime = 0;
    let confidenceCount = 0;

    session.questions.forEach((q) => {
      totalTime += q.timeTakenSeconds || 0;
      if (q.evaluation && typeof q.evaluation.score === "number") {
        totalScore += q.evaluation.score;
        const bd = q.evaluation.breakdown || {};
        totalClarity += bd.logicalStructure || 0;
        totalRelevance += bd.keywordRelevance || 0;
        totalCompleteness += bd.completeness || 0;
        if (typeof q.evaluation.confidenceScore === "number" && q.evaluation.confidenceScore > 0) {
          totalConfidence += q.evaluation.confidenceScore;
          confidenceCount += 1;
        }
      }
    });

    const qLen = session.questions.length || 1;
    session.overallScore = Math.round(totalScore / qLen);
    session.avgClarity = Math.round(totalClarity / qLen);
    session.avgRelevance = Math.round(totalRelevance / qLen);
    session.avgCompleteness = Math.round(totalCompleteness / qLen);
    session.avgConfidence = confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : (session.mode === "voice" ? 75 : 0);
    session.timeTaken = totalTime;

    // AI Strengths and Weaknesses generation
    if (API_KEY) {
      try {
        const summaryPrompt = `Analyze the candidate's answers and evaluations for this mock interview session.
Target Role: ${session.targetRole}
Q&A and Scores:
${session.questions.map((q, idx) => `Q${idx+1}: "${q.question}"\nAnswer: "${q.studentAnswer}"\nScore: ${q.evaluation?.score || 0}/100\nFeedback: "${q.evaluation?.feedback || ""}"`).join("\n\n")}

Provide a JSON object containing the overall key strengths (2 bullet points) and weaknesses (2 bullet points) of the candidate (NO markdown fences, NO extra text):
{
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}`;

        const summaryResponse = await axios.post(
          GEMINI_URL(API_KEY),
          {
            contents: [{ parts: [{ text: summaryPrompt }] }],
            generationConfig: EVAL_CONFIG
          },
          { headers: { "Content-Type": "application/json" }, timeout: 60000 }
        );

        const rawText = summaryResponse.data.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedSummary = JSON.parse(jsonMatch[0]);
          session.strengths = parsedSummary.strengths || [];
          session.weaknesses = parsedSummary.weaknesses || [];
        }
      } catch (e) {
        console.error("Session summary AI Call failed:", e.message);
      }
    }

    // Fallbacks if AI summary fails
    if (!session.strengths || session.strengths.length === 0) {
      session.strengths = [
        "Demonstrated a strong foundational understanding of key concepts.",
        "Attempted all questions and structured code answers logically."
      ];
    }
    if (!session.weaknesses || session.weaknesses.length === 0) {
      session.weaknesses = [
        "Failed to elaborate on certain architectural details or quantitative outcomes.",
        "Could utilize terminology more precisely and reduce wordiness in behavioral explanations."
      ];
    }

    session.status = "completed";
    session.completedAt = new Date();
    session.proctoringScore = proctoringScore !== undefined ? proctoringScore : 100;
    session.warnings = warnings || [];

    await InterviewSession.updateOne(
      { _id: session._id },
      {
        $set: {
          overallScore: session.overallScore,
          avgClarity: session.avgClarity,
          avgRelevance: session.avgRelevance,
          avgCompleteness: session.avgCompleteness,
          avgConfidence: session.avgConfidence,
          timeTaken: session.timeTaken,
          strengths: session.strengths,
          weaknesses: session.weaknesses,
          status: session.status,
          completedAt: session.completedAt,
          proctoringScore: session.proctoringScore,
          warnings: session.warnings
        }
      }
    );

    return res.status(200).json({ success: true, session });
  } catch (error) {
    console.error("Submit Answers Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSessionHistory = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Sort by createdAt ascending to correctly feed line chart time flows
    const sessions = await InterviewSession.find({ userId: req.user._id, status: "completed" }).sort({ createdAt: 1 }).limit(20);
    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.userId && req.user?._id && session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not own this session" });
    }
    return res.status(200).json({ success: true, session });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
