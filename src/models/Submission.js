import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      default: "javascript",
    },

    problemTitle: {
      type: String,
      default: "Untitled",
    },

    jobId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
    },

    reviewResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Submission ||
  mongoose.model("Submission", submissionSchema);
