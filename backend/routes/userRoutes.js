const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const joiValidate = require("../middleware/joiValidateMiddleware");
const {
  createUserJoiSchemas,
  loginJoiSchemas,
  updateUserDetailsJoiSchemas,
  sendPasswordResetLinkJoiSchemas,
  changePasswordJoiSchemas,
  resetPasswrodJoiSchemas,
} = require("../config/joiConfig");
const {
  createUser,
  getUserByResetPasswordKey,
  login,
  sendPasswordResetLink,
  changePassword,
  updateUserDetails,
  getUsers,
  getMe,
  deleteUser,
  resetPassword,
  logout,
} = require("../controllers/userController");
const { ADMIN_LEVEL_ROLES } = require("../config/general");

// create user in admin table
router.post(
  "/",
  protect(ADMIN_LEVEL_ROLES),
  joiValidate(createUserJoiSchemas),
  createUser
);

// delete user
router.delete("/", protect(ADMIN_LEVEL_ROLES), deleteUser);

// get all users list
router.post("/search", protect(ADMIN_LEVEL_ROLES), getUsers);

// profile section
router.get("/me", protect(), getMe);

//get user in sign in page
router.get("/:resetPasswordKey", getUserByResetPasswordKey);

// user login
router.post("/login", joiValidate(loginJoiSchemas), login);

router.get("/logout", logout);

// forgot password and otp
router.post(
  "/send-password-reset-link",
  joiValidate(sendPasswordResetLinkJoiSchemas),
  sendPasswordResetLink
);

// change password from profile
router.post(
  "/change-password",
  protect(),
  joiValidate(changePasswordJoiSchemas),
  changePassword
);

// edit or update
router.post(
  "/update-user-details",
  protect(),
  joiValidate(updateUserDetailsJoiSchemas),
  updateUserDetails
);

// reset password from forgot password link
router.post(
  "/reset-password",
  joiValidate(resetPasswrodJoiSchemas),
  resetPassword
);

module.exports = router;
