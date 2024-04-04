const mongoose = require("mongoose");
const { Schema } = mongoose;

// Order Item Schema
const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  grams: { type: Number, required: true, min: 1 }, // The weight of the product in grams per unit in the order
  price: { type: Number, required: true, min: 0 }, // Price for the specified weight, potentially redundant but useful for historical data
  quantity: { type: Number, required: true, min: 1 }, // Quantity of the product in the specified denomination
});

// Order Schema
const orderSchema = new Schema({
  items: [orderItemSchema], // Array of items in the order
  totalPrice: { type: Number, required: true, min: 0 }, // Redundant field to quickly access the order's total price
  totalWeight: { type: Number, required: true, min: 0 }, // Redundant field for the total weight of the order in grams
  status: {
    type: String,
    enum: ["new", "cancelled", "finished"],
    required: true,
  },
  archived: {
    type: Boolean,
    required: true,
    default: false,
    validate: {
      validator: function (value) {
        // Archived can only be true if the status is 'cancelled' or 'finished'
        if (value === true) {
          return ["cancelled", "finished"].includes(this.status);
        }
        return true;
      },
      message: "Only cancelled or finished orders can be archived",
    },
  },
  orderDate: { type: Date, default: Date.now }, // The date the order was placed
  updatedDate: { type: Date, default: Date.now }, // The date of the last update to the order
});

module.exports = mongoose.model("Order", orderSchema);
