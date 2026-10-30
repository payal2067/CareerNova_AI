import axios from "axios";
import Resume from "../models/resume.model.js";

// ─────────────────────────────────────────────────────────
// Model Config
// gemini-2.5-pro is a "thinking" model — by default it uses
// internal reasoning tokens which makes it SLOW (20+ sec).
// thinkingConfig: { thinkingBudget: 0 } disables that → 6-9 sec
// ─────────────────────────────────────────────────────────
const ANALYZE_MODEL = "gemini-2.5-flash";

// ✅ Suppress pdf2json stderr noise - skipped because we don't have pdf2json

// ✅ Safe Gemini caller — proper validation at every step
const callGemini = async (API_KEY, model, prompt, generationConfig) => {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
  );

  const data = response.data;
  if (!data) throw new Error("Gemini returned empty response body");
  if (data.error) throw new Error(`Gemini API Error: ${data.error.message}`);
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error(`Gemini returned no candidates. Block reason: ${data.promptFeedback?.blockReason || 'Unknown'}`);
  }
  const candidate = data.candidates[0];
  if (!candidate.content?.parts?.length) {
    throw new Error(`Gemini candidate empty. Finish reason: ${candidate.finishReason || 'Unknown'}`);
  }
  return candidate.content.parts[0].text;
};

export const analyzeResume = async (req, res) => {
  try {
    const API_KEY = process.env.GEMINI_API_KEY?.trim();
    if (!API_KEY) {
      return res.status(500).json({ success: false, message: "Gemini API Key missing in .env" });
    }

    let rawText = "";
    const desiredRole = typeof req.body.targetRole === "string"
      ? req.body.targetRole.trim().slice(0, 100)
      : "General Learner";

    // 1. PDF Text Extraction with type guard
    rawText = typeof req.body.resumeText === "string" ? req.body.resumeText : "";

    if (!rawText || rawText.trim().length < 50) {
      return res.status(400).json({ success: false, message: "Resume content must be at least 50 characters long." });
    }

    // ✅ SPEED FIX: Trim resume to max 3000 chars — LLM ko zyada context ki zarurat nahi
    // Extra whitespace bhi hatao, ye tokens waste karta hai
    const trimmedText = rawText.replace(/\s+/g, ' ').trim().slice(0, 3000);

    const prompt = `You are an expert Technical Recruiter. Analyze this resume for the role: "${desiredRole}".

Resume: "${trimmedText}"

Return ONLY this JSON (no markdown, no extra text):
{
  "detectedRole": "${desiredRole}",
  "skillRelevance": <0-100>,
  "projectDepth": <0-100>,
  "experienceScore": <0-100>,
  "structureScore": <0-100>,
  "extractedSkills": ["skill1","skill2"],
  "missingSkills": ["missing skills for ${desiredRole}"],
  "weakTopics": ["topics to study for ${desiredRole} interviews"],
  "analysisReport": "2-3 sentence summary"
}`;

    console.log(`📡 Calling Gemini API using model: ${ANALYZE_MODEL}`);
    const startTime = Date.now();

    const responseText = await callGemini(API_KEY, ANALYZE_MODEL, prompt, {
      response_mime_type: "application/json",
      temperature: 0.1,
      maxOutputTokens: 2048,
      topP: 0.8,
      topK: 20,
      // ✅ KEY SPEED FIX: Disable internal "thinking" for gemini-2.5-pro
      // Without this, model spends 15-20 sec "thinking" before responding
      thinkingConfig: { thinkingBudget: 0 }
    });

    console.log(`⚡ Gemini responded in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    let aiData;
    try {
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      aiData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("❌ JSON Parse Error. Raw response:", responseText);
      throw new Error("AI ne valid JSON nahi diya: " + parseErr.message, { cause: parseErr });
    }

    // 3. Scoring & DB Save
    const finalScore =
      (aiData.skillRelevance * 0.4) +
      (aiData.projectDepth * 0.3) +
      (aiData.experienceScore * 0.2) +
      (aiData.structureScore * 0.1);

    const analysis = await Resume.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        targetRole: aiData.detectedRole || desiredRole,
        metrics: {
          skillRelevance: aiData.skillRelevance || 0,
          projectDepth: aiData.projectDepth || 0,
          experienceScore: aiData.experienceScore || 0,
          structureScore: aiData.structureScore || 0
        },
        finalStrengthScore: Math.round(finalScore),
        extractedSkills: aiData.extractedSkills || [],
        missingSkills: aiData.missingSkills || [],
        weakTopics: aiData.weakTopics || [],
        analysisReport: aiData.analysisReport || ""
      },
      { upsert: true, returnDocument: 'after', lean: true }
    );

    // Send response immediately — assignments background mein chalenge
    res.status(200).json({ success: true, data: analysis });

    // 4. Background Assignment Logic - skipped since we don't have Assignment model

  } catch (err) {
    console.error(`❌ AI Error on ${ANALYZE_MODEL}:`, err.response?.status, err.response?.data?.error?.message || err.message);
    const status = err.response?.status || 500;
    return res.status(status).json({ success: false, message: `AI Analysis failed! (${err.message})` });
  }
};

export const runCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ success: false, message: "Code and language are required." });
    }
    const API_KEY = process.env.GEMINI_API_KEY?.trim();
    if (!API_KEY) {
      return res.status(500).json({ success: false, message: "Gemini API Key missing in .env" });
    }

    const prompt = `You are a ${language} compiler simulator. Return EXACTLY what a real compiler would output.
STRICT RULES:
1. Syntax errors → return EXACT error message
2. Runtime errors → return EXACT runtime error
3. Success → return ONLY stdout output
4. No explanation, no markdown, raw output only.

Language: ${language}
Code:
${code}`;

    console.log(`💻 Running code simulation using: ${ANALYZE_MODEL}`);
    const output = await callGemini(API_KEY, ANALYZE_MODEL, prompt, {
      temperature: 0.1,
      maxOutputTokens: 1024,
      topP: 0.8,
      topK: 10,
      thinkingConfig: { thinkingBudget: 0 } // ✅ Fast for code too
    });

    return res.status(200).json({ success: true, output: output.trim() });
  } catch (err) {
    console.error("❌ runCode error:", err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getReport = async (req, res) => {
  try { return res.render('report'); }
  catch { return res.redirect('/dashboard'); }
};

export const getRawReportData = async (req, res) => {
  try {
    const analysis = await Resume.findOne({ userId: req.user.id }).lean();
    if (!analysis) return res.status(404).json({ success: false, message: "Pehle resume analyze karo bhai!" });
    return res.status(200).json({ success: true, data: analysis });
  } catch { return res.status(500).json({ success: false }); }
};

export const rewriteBulletPoints = async (req, res) => {
  try {
    const API_KEY = process.env.GEMINI_API_KEY?.trim();
    const { bulletPoint, targetRole, jobDescription } = req.body;

    if (typeof bulletPoint !== "string" || !bulletPoint.trim()) {
      return res.status(400).json({ success: false, message: "Valid bullet point text is required." });
    }

    const cleanBullet = bulletPoint.trim().slice(0, 1000);
    const cleanRole = typeof targetRole === "string" ? targetRole.trim().slice(0, 100) : "Software Engineer";
    const cleanJD = typeof jobDescription === "string" ? jobDescription.trim().slice(0, 1000) : "";

    if (!API_KEY) {
      return res.status(200).json({
        success: true,
        improvedBullets: [
          `Architected and deployed scalable solutions for ${cleanRole}, reducing system latency by 35%.`,
          `Spearheaded the development of key modules, improving overall team delivery velocity by 25%.`,
          `Optimized application workflow and codebase structure, leading to a 40% reduction in user-reported bugs.`
        ]
      });
    }

    const prompt = `Rewrite the following resume bullet point to make it strong, action-oriented, metrics-driven, and aligned with the role of "${cleanRole}".\n\nOriginal Bullet Point: "${cleanBullet}"\nTarget Role / Context: "${cleanJD || cleanRole}"\n\nReturn ONLY a JSON array containing 3 improved variations (strong action verb + core task + measurable metric outcome). No markdown, no extra commentary.\nExample output format:\n["Variation 1", "Variation 2", "Variation 3"]`;

    const responseText = await callGemini(API_KEY, ANALYZE_MODEL, prompt, {
      temperature: 0.7,
      maxOutputTokens: 1024,
      thinkingConfig: { thinkingBudget: 0 }
    });
    
    const cleaned = responseText.replace(/```json|```/g, "").trim();
    const improvedBullets = JSON.parse(cleaned);

    return res.status(200).json({ success: true, improvedBullets });
  } catch (error) {
    console.error("Rewrite Bullet Points Error:", error);
    return res.status(500).json({
      success: false,
      message: "Bullet rewrite failed",
      improvedBullets: [
        `Engineered high-performance components using modern best practices, improving system efficiency.`,
        `Led cross-functional efforts to deliver core product features ahead of schedule.`,
        `Streamlined data processing workflows, reducing operational overhead by 20%.`
      ]
    });
  }
};

export const getResumeHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const history = await Resume.find({ userId }).sort({ createdAt: -1 }).limit(20);
    return res.status(200).json({ success: true, history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
