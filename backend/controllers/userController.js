const asyncHandler = require("express-async-handler");
const {
  createUserService,
  generateRegistrationOtpService,
  registerService,
  loginService,
  updateUserDetailsService,
  sendPasswordResetLinkService,
  changePasswordService,
  resetPasswordService,
  deleteUserService,
  getUsersService,
  getUserByKeyService,
  checkCanAccessContactEmailService
} = require("../services/userServices");

const { sanitize } = require("../utils/responseSanitizer");
const {
  getAssignedContactEmailsService,
} = require("../services/userSyncServices");

const createUser = asyncHandler(async (req, res) =>
  res
    .status(201)
    .json(sanitize(await createUserService(req.body), "User", req.user.role))
);

const generateRegistrationOtp = asyncHandler(async (req, res) =>
  res.status(200).json(await generateRegistrationOtpService(req.body))
);

const getUsers = asyncHandler(async (req, res) => {
  const userResult = await getUsersService(req.body);
  userResult.results = userResult.results.map((user) =>
    sanitize(user, "User", req.user.role)
  );
  res.status(200).json(userResult);
});

const getAssignedContactEmails = asyncHandler(async (req, res) => {
  res.status(200).json(await getAssignedContactEmailsService(req.body));
});

const checkCanAccessContactEmail = asyncHandler(async (req, res) => {
  res.status(200).json(await checkCanAccessContactEmailService(req.body));
});


const getMe = asyncHandler(async (req, res) =>
  res.status(200).json(sanitize(req.user, "User", req.user.role))
);

const getUserByResetPasswordKey = asyncHandler(async (req, res) => {
  const { resetPasswordKey } = req.params;
  const userResult = await getUserByKeyService(resetPasswordKey);
  res.status(200).json({ name: userResult.name, email: userResult.email });
});

const register = asyncHandler(async (req, res) => {
  const registeredUser = await registerService(req.body);
  res
    .cookie("user-token-crm", registeredUser.token, {
      httpOnly: true,
      secure: true, // Use this only if you're using HTTPS, which you should be
      sameSite: "strict", // This helps protect against CSRF
    })
    .status(200)
    .json(sanitize(registeredUser, "User", "All"));
});

const login = asyncHandler(async (req, res) => {
  const loggedInUser = await loginService(req.body);
  res
    .cookie("user-token-crm", loggedInUser.token, {
      httpOnly: true,
      secure: true, // Use this only if you're using HTTPS, which you should be
      sameSite: "strict", // This helps protect against CSRF
    })
    .status(200)
    .json(sanitize(loggedInUser, "User", "All"));
});

const logout = asyncHandler(async (req, res) => {
  // Clear the "user-token-crm" cookie
  res.clearCookie("user-token-crm", {
    httpOnly: true,
    secure: true, // Use this only if you're using HTTPS
    sameSite: "strict", // This helps protect against CSRF
  });

  res.status(200).json({
    success: true,
    message: "Successfully logged out",
  });
});

const updateUserDetails = asyncHandler(async (req, res) =>
  res
    .status(200)
    .json(
      sanitize(await updateUserDetailsService(req.body), "User", req.user.role)
    )
);

const sendPasswordResetLink = asyncHandler(async (req, res) =>
  res.status(200).json(await sendPasswordResetLinkService(req.body))
);

const changePassword = asyncHandler(async (req, res) =>
  res.status(200).json(
    sanitize(
      await changePasswordService({
        user: req.user,
        ...req.body,
      }),
      "User",
      req.user.role
    )
  )
);

const resetPassword = asyncHandler(async (req, res) =>
  res
    .status(200)
    .json(sanitize(await resetPasswordService(req.body), "User", "All"))
);

const deleteUser = asyncHandler(async (req, res) =>
  res.status(200).json(await deleteUserService(req.body, req.user.email))
);

module.exports = {
  createUser,
  generateRegistrationOtp,
  register,
  login,
  logout,
  updateUserDetails,
  sendPasswordResetLink,
  changePassword,
  resetPassword,
  deleteUser,
  getUsers,
  getAssignedContactEmails,
  checkCanAccessContactEmail,
  getMe,
  getUserByResetPasswordKey,
};
