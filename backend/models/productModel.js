const mongoose = require("mongoose");

const { Schema } = mongoose;

// Unit Price Schema
const unitPriceSchema = new Schema({
  grams: { type: Number, required: true, min: 1 }, // Minimum of 1g
  price: { type: Number, required: true, min: 0 }, // Price for the specified grams
});

// Price History Schema
const priceHistorySchema = new Schema({
  unitPrices: [unitPriceSchema], // Now tracks changes to unit pricing
  date: { type: Date, default: Date.now },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Stock Transaction Schema
const stockTransactionSchema = new Schema({
  type: { type: String, enum: ["add", "remove", "override"], required: true },
  quantity: { type: Number, required: true }, // This could be in grams to match the unit of measurement
  date: { type: Date, default: Date.now },
  note: String, // Optional note for context on the transaction
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Product Schema
const productSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  strain: { type: String, required: true },
  THCContent: { type: Number, required: true },
  CBDContent: { type: Number, required: true },
  terpenes: [String],
  unitPrices: [unitPriceSchema], // Defines available quantities and their prices
  priceHistory: [priceHistorySchema],
  stock: { type: Number, required: true, min: 0 },
  stockTransactions: [stockTransactionSchema],
});

module.exports = mongoose.model("Product", productSchema);
