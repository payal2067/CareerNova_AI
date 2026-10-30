import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Job description provided for resume analysis
    jobDescription: {
      type: String,
      default: "General Resume Analysis",
      trim: true,
    },

    // AI Metrics (Weighted logic)
    metrics: {
      skillRelevance: {
        type: Number,
        default: 0,
      }, // 40% weight

      projectDepth: {
        type: Number,
        default: 0,
      }, // 30% weight

      experienceScore: {
        type: Number,
        default: 0,
      }, // 20% weight

      structureScore: {
        type: Number,
        default: 0,
      }, // 10% weight
    },

    // Calculated overall score
    finalStrengthScore: {
      type: Number,
      default: 0,
    },

    candidateName: {
      type: String,
      default: "",
    },

    experience: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    projects: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    // Intelligence for Future Modules
    extractedSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    weakTopics: {
      type: [String],
      default: [],
    },

    // Detailed AI suggestions
    analysisReport: {
      type: String,
      default: "",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize resume listing & analytics query performance
resumeSchema.index({ userId: 1, createdAt: -1 });

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
