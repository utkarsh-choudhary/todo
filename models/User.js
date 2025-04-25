import mongoose from "mongoose";
import { type } from "os";


const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false, // make it optional for Google users
      select: false, // don't include password in queries by default
    },
    phone: {
      type: String,
      required: false, // make it optional for Google users
    },
    name: {
      type: String,
      required: false, // full name from Google
    },
    profilePic: {
      type: String,
      required: false, // profile image URL from Google
    },
    firebaseUid: {
      type: String,
      required: false, // Firebase unique UID
    },
    resetPasswordToken: {
      type: String,
      required: false,
    },
    resetPasswordExpires: {
      type: Date,
      required: false,
    }
  },
  { timestamps: true }
);

// Add method to check if reset token is valid
userSchema.methods.isResetTokenValid = function() {
  return this.resetPasswordExpires && this.resetPasswordExpires > Date.now();
};

export const User = mongoose.model("User", userSchema);
