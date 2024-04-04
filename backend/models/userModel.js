const mongoose = require("mongoose");
const { ALL_ROLES } = require("../config/general");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w+)+$/.test(v);
        },
        message: "Please enter a valid email",
      },
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
    },
    roles: [
      {
        type: String,
        enum: ALL_ROLES,
        required: true,
      },
    ],
    club: { type: mongoose.SchemaTypes.ObjectId, ref: "Club" },
    active: {
      type: Boolean,
      default: false,
    },
    resetPasswordKey: {
      type: String,
    },
    resetPasswordKeyExpiry: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
