const express = require("express");
const router = express.Router();
const {
  createDiscussion,
  getDiscussions,
  getDiscussion,
  likeDiscussion,
  postReply,
  likeReply,
} = require("../controllers/discussionController");
const { protect } = require("../middleware/authMiddleware");
const { ROLES } = require("../config/general");

// Discussions
router
  .route("/")
  .get(getDiscussions) // List all discussions
  .post(
    protect([
      ROLES.CLUB_MEMBER,
      ROLES.CLUB_ADMIN,
      ROLES.CLUB_MODERATOR,
      ROLES.ADMIN,
      ROLES.SITE_MODERATOR,
    ]),
    createDiscussion
  ); // Create a new discussion

router
  .route("/:discussionId")
  .get(getDiscussion) // Get a single discussion by ID
  .post(
    protect([
      ROLES.CLUB_MEMBER,
      ROLES.CLUB_ADMIN,
      ROLES.CLUB_MODERATOR,
      ROLES.ADMIN,
      ROLES.SITE_MODERATOR,
    ]),
    postReply
  ); // Post a reply to a discussion

router
  .route("/:discussionId/like")
  .put(
    protect([
      ROLES.CLUB_MEMBER,
      ROLES.CLUB_ADMIN,
      ROLES.CLUB_MODERATOR,
      ROLES.ADMIN,
      ROLES.SITE_MODERATOR,
    ]),
    likeDiscussion
  ); // Like a discussion

// Replies
router
  .route("/:discussionId/replies/:replyId")
  .post(
    protect([
      ROLES.CLUB_MEMBER,
      ROLES.CLUB_ADMIN,
      ROLES.CLUB_MODERATOR,
      ROLES.ADMIN,
      ROLES.SITE_MODERATOR,
    ]),
    postReply
  ); // Post a nested reply

router
  .route("/:discussionId/replies/:replyId/like")
  .put(
    protect([
      ROLES.CLUB_MEMBER,
      ROLES.CLUB_ADMIN,
      ROLES.CLUB_MODERATOR,
      ROLES.ADMIN,
      ROLES.SITE_MODERATOR,
    ]),
    likeReply
  ); // Like a reply

module.exports = router;
