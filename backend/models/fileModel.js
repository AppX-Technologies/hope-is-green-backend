const mongoose = require("mongoose");

const fileSchema = mongoose.Schema(
  {
    length: { type: Number },
    chunkSize: { type: Number },
    uploadDate: { type: Date },
    filename: { type: String, trim: true, searchable: true },
    contentType: { type: String },
  },
  { collection: "uploads.files" }
);

module.exports = mongoose.model("File", fileSchema);
