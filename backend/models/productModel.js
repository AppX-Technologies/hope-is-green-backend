const mongoose = require("mongoose");

const { Schema } = mongoose;

// Price History Schema
const priceHistorySchema = new Schema({
  price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the User who made the price change
});

// Stock Transaction Schema
const stockTransactionSchema = new Schema({
  type: { type: String, enum: ["add", "remove", "override"], required: true },
  quantity: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: String, // Optional note for context on the transaction
  user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the User who made the transaction
});

// Product Schema
const productSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  strain: { type: String, required: true }, // e.g., Indica, Sativa, Hybrid
  THCContent: { type: Number, required: true }, // THC percentage
  CBDContent: { type: Number, required: true }, // CBD percentage
  terpenes: [String], // Common terpenes for flavor and effect
  price: { type: Number, required: true }, // Current price
  priceHistory: [priceHistorySchema], // Track price changes over time
  stock: { type: Number, required: true, min: 0 }, // Current stock
  stockTransactions: [stockTransactionSchema], // Track stock changes
  isHouseProduct: { type: Boolean, default: false }, //if false product belongs to a club otherwise superadmin
  ownerClub: { type: Schema.Types.ObjectId, ref: "Club" },
  listed: { type: Boolean, default: false },
});

module.exports = mongoose.model("Product", productSchema);
