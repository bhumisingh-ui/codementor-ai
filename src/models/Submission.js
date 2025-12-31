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
  },
  { timestamps: true }
);

export default mongoose.models.Submission ||
  mongoose.model("Submission", submissionSchema);
