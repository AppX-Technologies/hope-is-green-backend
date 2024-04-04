const mongoose = require("mongoose");
const { Schema } = mongoose;

// Reply Schema
const replySchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  postedAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 }, // To track likes for each reply
  replies: [replySchema], // Embedded replies
});

// Discussion (Thread) Schema
const discussionSchema = new Schema({
  club: { type: Schema.Types.ObjectId, ref: "Club", required: true }, // Reference to the Club
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  postedAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 }, // To track likes for the discussion
  replies: [replySchema], // Embedded replies
});

module.exports = mongoose.model("Discussion", discussionSchema);
