const express = require("express");
const router = express.Router();
const {
  searchFilters,
  createFilter,
  updateFilter,
  updateMultipleFilters,
  deleteFilter,
} = require("../controllers/filterController");
const { protect } = require("../middleware/authMiddleware");
const { ALL_ROLES, ADMIN_LEVEL_ROLES } = require("../config/general");

router
  .route("/")
  .post(protect(ADMIN_LEVEL_ROLES), createFilter)
  .put(protect(ADMIN_LEVEL_ROLES), updateMultipleFilters);
router
  .route("/:id")
  .delete(protect(ADMIN_LEVEL_ROLES), deleteFilter)
  .put(protect(ADMIN_LEVEL_ROLES), updateFilter);

router.route("/search").post(protect(ALL_ROLES), searchFilters);

module.exports = router;
