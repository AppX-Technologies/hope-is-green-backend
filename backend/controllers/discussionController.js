const asyncHandler = require("express-async-handler");
const {
  createDiscussionService,
  getDiscussionsService,
  getDiscussionService,
  likeDiscussionService,
  postReplyService,
  likeReplyService,
} = require("../services/discussionServices");

// Create a new discussion
const createDiscussion = asyncHandler(async (req, res) => {
  const discussion = await createDiscussionService(req.body, req.user);
  if (!discussion) {
    res
      .status(403)
      .json({ message: "User is not a member of the specified club" });
    return;
  }
  res.status(201).json(discussion);
});

// Get all discussions a user is allowed to see, based on club membership
const getDiscussions = asyncHandler(async (req, res) => {
  const discussions = await getDiscussionsService(req.user);
  res.status(200).json(discussions);
});

// Get a specific discussion by ID, ensuring the user is a member of the club
const getDiscussion = asyncHandler(async (req, res) => {
  const discussion = await getDiscussionService(
    req.params.discussionId,
    req.user
  );
  if (!discussion) {
    res
      .status(404)
      .json({ message: "Discussion not found or user not authorized" });
    return;
  }
  res.status(200).json(discussion);
});

// Like a discussion, ensuring the user is a member of the club
const likeDiscussion = asyncHandler(async (req, res) => {
  const updatedDiscussion = await likeDiscussionService(
    req.params.discussionId,
    req.user
  );
  if (!updatedDiscussion) {
    res
      .status(404)
      .json({ message: "Discussion not found or user not authorized" });
    return;
  }
  res.status(200).json(updatedDiscussion);
});

// Post a reply to a discussion, ensuring the user is a member of the club
const postReply = asyncHandler(async (req, res) => {
  const reply = await postReplyService(
    req.params.discussionId,
    req.body,
    req.user
  );
  if (!reply) {
    res
      .status(404)
      .json({ message: "Discussion not found or user not authorized" });
    return;
  }
  res.status(201).json(reply);
});

// Like a reply, ensuring the user is a member of the club
const likeReply = asyncHandler(async (req, res) => {
  const updatedReply = await likeReplyService(
    req.params.discussionId,
    req.params.replyId,
    req.user
  );
  if (!updatedReply) {
    res.status(404).json({ message: "Reply not found or user not authorized" });
    return;
  }
  res.status(200).json(updatedReply);
});

module.exports = {
  createDiscussion,
  getDiscussions,
  getDiscussion,
  likeDiscussion,
  postReply,
  likeReply,
};
