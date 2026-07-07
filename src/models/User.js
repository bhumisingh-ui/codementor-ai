import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    resetTokenHash: {
      type: String,
    },
    resetTokenExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

UserSchema.index({ resetTokenHash: 1 }, { sparse: true });
UserSchema.index({ resetTokenExpiresAt: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);
