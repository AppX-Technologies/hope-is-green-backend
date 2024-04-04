const mongoose = require("mongoose");
const { Schema } = mongoose;

// Entry Fee History Schema
const entryFeeHistorySchema = new Schema({
  fee: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
});

// Club Fee Payment History Schema
const clubFeePaymentHistorySchema = new Schema({
  feePaid: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
});

// Club Settings Schema
const clubSettingsSchema = new Schema({
  approvalRequired: { type: Boolean, default: true }, // Whether approval is needed to enter the club
  searchVisibility: { type: Boolean, default: true }, // Whether the club appears in search or is link-only
  postApprovalRequired: { type: Boolean, default: false }, // Whether posts need admin approval
});

// Club Schema
const clubSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  moderators: [{ type: Schema.Types.ObjectId, ref: "User" }], // Array of User references
  entryFeeHistory: [entryFeeHistorySchema],
  currentEntryFees: { type: Number, required: true, min: 0 },
  clubSettings: { type: clubSettingsSchema, required: true },
  currentClubFees: { type: Number, required: true, min: 0 }, // Fees to be paid to the franchise
  clubFeePaymentHistory: [clubFeePaymentHistorySchema],
  currentClubCredit: { type: Number, required: true, min: 0 }, // Current credit balance
  nextRenewalDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Operating", "Suspended", "Terminated"],
    default: "Operating",
  },
});

module.exports = mongoose.model("Club", clubSchema);
