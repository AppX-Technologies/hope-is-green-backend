const express = require("express");
const router = express.Router();
const {
  getClubDetails,
  createClub,
  updateClubDetails,
  updateClubSettings,
  addEntryFeeRecord,
  addClubFeePaymentRecord,
  deleteClub,
  updateClubStatus,
  listAllClubs,
} = require("../controllers/clubController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { ROLES } = require("../config/general");

// List all clubs - Visible to Site Moderator and Admins only
router
  .route("/")
  .get(protect, authorize(ROLES.ADMIN, ROLES.SITE_MODERATOR), listAllClubs);

// Create a new club - Restricted to Admin and Site Moderator
router
  .route("/")
  .post(protect, authorize(ROLES.ADMIN, ROLES.SITE_MODERATOR), createClub);

// Get club details - Visible to Club members and higher roles
router
  .route("/:clubId")
  .get(
    protect([
      ROLES.CLUB_MEMBER,
      ROLES.CLUB_MODERATOR,
      ROLES.CLUB_ADMIN,
      ROLES.SITE_MODERATOR,
      ROLES.ADMIN,
    ]),
    getClubDetails
  )
  .put(
    protect([ROLES.CLUB_ADMIN, ROLES.ADMIN, ROLES.SITE_MODERATOR]),
    updateClubDetails
  );

// Update club settings - Club Admin and higher roles can do this
router
  .route("/:clubId/settings")
  .put(
    protect([ROLES.CLUB_ADMIN, ROLES.SITE_MODERATOR, ROLES.ADMIN]),
    updateClubSettings
  );

// Add entry fee record - Club Admin and Moderators can do this
router
  .route("/:clubId/entryFee")
  .post(protect([ROLES.CLUB_ADMIN, ROLES.CLUB_MODERATOR]), addEntryFeeRecord);

// Add club fee payment record - Club Admin only
router
  .route("/:clubId/clubFeePayment")
  .post(protect(ROLES.CLUB_ADMIN), addClubFeePaymentRecord);

// Update club status (Operating, Suspended, Terminated) - Site Moderator and Admins only
router
  .route("/:clubId/status")
  .put(protect([ROLES.SITE_MODERATOR, ROLES.ADMIN]), updateClubStatus);

// Delete a club - Restricted to Site Admins only
router.route("/:clubId").delete(protect([ROLES.ADMIN]), deleteClub);

module.exports = router;
