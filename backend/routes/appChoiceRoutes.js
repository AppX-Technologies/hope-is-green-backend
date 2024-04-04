const express = require("express");
const router = express.Router();
const {
  getAppChoices,
  createAppChoice,
  updateAppChoice,
  deleteEntireAppChoice,
  deleteAppChoiceValue,
} = require("../controllers/appChoiceController");
const { protect } = require("../middleware/authMiddleware");
const { ADMIN_LEVEL_ROLES, ALL_ROLES } = require("../config/general");
router.route("/list").post(protect(ALL_ROLES), getAppChoices); // Only General Information Of App Choices Should Be Provided To Unauthorised User
router.route("/").post(protect(ADMIN_LEVEL_ROLES), createAppChoice);
router
  .route("/:id")
  .delete(protect(ADMIN_LEVEL_ROLES), deleteEntireAppChoice)
  .put(protect(ADMIN_LEVEL_ROLES), updateAppChoice);
router
  .route("/:id/:valueId")
  .delete(protect(ADMIN_LEVEL_ROLES), deleteAppChoiceValue);
module.exports = router;
