import express from "express";
import multer from "multer";
import parseResume from "../utils/parseResume.js";
import matchJD from "../utils/matchJD.js";
import Resume from "../models/resume.model.js";
import { AuthProtect } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.post("/upload", AuthProtect, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    const jobDescription =
      req.body.job_description?.trim() ||
      req.body.jobDescription?.trim() ||
      "General Software Engineering & Technical Profile";

    const parsedResume = await parseResume(req.file);
    const matchResult = await matchJD(parsedResume, jobDescription);

    const userId = req.user?._id || req.user?.id;
    let savedRecordId = null;

    if (userId) {
      const score = matchResult?.match_score || 0;
      const savedRecord = await Resume.create({
        userId,
        jobDescription,
        candidateName: parsedResume.name || "Candidate",
        experience: parsedResume.experience || [],
        projects: parsedResume.projects || [],
        metrics: {
          skillRelevance: score,
          projectDepth: score,
          experienceScore: score,
          structureScore: score,
        },
        finalStrengthScore: score,
        extractedSkills: parsedResume.skills || [],
        missingSkills: matchResult?.missing_keywords || [],
        weakTopics: [],
        analysisReport: matchResult?.summary || "",
      });
      savedRecordId = savedRecord._id;
    }

    return res.json({
      success: true,
      parsedResume,
      matchResult,
      savedRecordId,
    });
  } catch (error) {
    console.error("Resume Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: "Resume processing failed",
      error: error.message,
    });
  }
});

export default router;
