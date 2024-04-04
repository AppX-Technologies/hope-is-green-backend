const mongoose = require("mongoose");

const choiceValueSchema = mongoose.Schema({
  value: { type: mongoose.SchemaTypes.Mixed, required: true },
  editable: { type: Boolean, default: true },
  deletable: { type: Boolean, default: true },
});

const appChoiceSchema = mongoose.Schema({
  key: { type: String, required: [true, "Key for app choices is required."] },
  values: [choiceValueSchema],
});


module.exports = mongoose.model("AppChoice", appChoiceSchema);
