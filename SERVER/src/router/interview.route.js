import express from "express";
import {
  startSimulation,
  evaluateAnswer,
  submitAnswers,
  getSessionHistory,
  getSessionById
} from "../controller/interviewSimController.js";
import { AuthProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/start", AuthProtect, startSimulation);
router.post("/evaluate", AuthProtect, evaluateAnswer);
router.post("/submit", AuthProtect, submitAnswers);
router.get("/history", AuthProtect, getSessionHistory);
router.get("/session/:id", AuthProtect, getSessionById);

export default router;
