import express from "express";
import { analyzeResume, rewriteBulletPoints, getResumeHistory } from "../controller/ai.controller.js";
import { AuthProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/analyze", AuthProtect, analyzeResume);
router.post("/rewrite-bullet", AuthProtect, rewriteBulletPoints);
router.get("/history", AuthProtect, getResumeHistory);

export default router;
