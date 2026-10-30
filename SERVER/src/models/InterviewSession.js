import mongoose from "mongoose";

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    targetRole: {
      type: String,
      required: true,
      trim: true,
    },

    skillStack: {
      type: [String],
      default: [],
    },

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },

    mode: {
      type: String,
      enum: ["text", "voice", "video"],
      default: "text",
    },

    questions: [
      {
        question: {
          type: String,
          required: true,
          trim: true,
        },

        category: {
          type: String,
          enum: [
            "Technical",
            "Behavioral",
            "System Design",
            "Project Deep Dive",
          ],
          required: true,
        },

        type: {
          type: String,
          enum: [
            "mcq",
            "short-answer",
            "code-bug",
            "code-output",
            "system-design",
            "behavioral",
          ],
          default: "short-answer",
        },

        options: {
          type: [String],
          default: [],
        },

        code: {
          type: String,
          default: "",
        },

        correctAnswer: {
          type: String,
          default: "",
        },

        studentAnswer: {
          type: String,
          default: "",
        },

        inputMode: {
          type: String,
          enum: ["text", "voice"],
          default: "text",
        },

        wasSkipped: {
          type: Boolean,
          default: false,
        },

        timeTakenSeconds: {
          type: Number,
          default: 0,
        },

        orderIndex: {
          type: Number,
        },

        basedOn: {
          type: String,
          default: "",
        },

        evaluation: {
          score: {
            type: Number,
            default: 0,
          },

          feedback: {
            type: String,
            default: "",
          },

          missingConcepts: {
            type: [String],
            default: [],
          },

          breakdown: {
            keywordRelevance: {
              type: Number,
              default: 0,
            },

            technicalDepth: {
              type: Number,
              default: 0,
            },

            logicalStructure: {
              type: Number,
              default: 0,
            },

            terminologyUsage: {
              type: Number,
              default: 0,
            },

            completeness: {
              type: Number,
              default: 0,
            },
          },

          confidenceScore: {
            type: Number,
            default: 0,
          },

          toneNotes: {
            type: String,
            default: "",
          },
        },
      },
    ],

    overallScore: {
      type: Number,
      default: 0,
    },

    // Time taken in seconds
    timeTaken: {
      type: Number,
      default: 0,
    },

    avgClarity: {
      type: Number,
      default: 0,
    },

    avgRelevance: {
      type: Number,
      default: 0,
    },

    avgCompleteness: {
      type: Number,
      default: 0,
    },

    avgConfidence: {
      type: Number,
      default: 0,
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    completedAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["started", "in_progress", "completed", "abandoned"],
      default: "started",
    },

    proctoringScore: {
      type: Number,
      default: 100,
    },

    warnings: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for history charts and status queries
interviewSessionSchema.index({ userId: 1, createdAt: 1 });
interviewSessionSchema.index({ userId: 1, status: 1 });

const InterviewSession = mongoose.model(
  "InterviewSession",
  interviewSessionSchema
);

export default InterviewSession;
