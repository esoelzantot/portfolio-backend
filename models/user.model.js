const mongoose = require("mongoose");
const validator = require("validator");

const userRoles = require("../utils/userRoles");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "invalid email address"],
    },

    password: {
      type: String,
      required: true,
      select: false, // never returned unless explicitly requested
    },

    avatar: {
      type: String,
      default: "uploads/avatar.jpg",
    },

    role: {
      type: String,
      enum: Object.values(userRoles),
      default: userRoles.USER,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.token; // legacy field from older versions
        delete ret.__v;
        return ret;
      },
    },
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
