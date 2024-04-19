const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/userModel");
const { search } = require("../utils/search");
const { userSearchPaths } = require("../config/searchConfig");
const { sendEmailFromTemplate } = require("../utils/appsScriptHelper");
const {
  ROLES,
  BLOCK_AFTER_UNSUCCESSFUL_LOGIN_ATTEMPTS_COUNT,
  BLOCK_AFTER_UNSUCCESSFUL_LOGIN_ATTEMPTS_FOR_MINS,
  OTP_COOLDOWN_PERIOD_MINS,
  OTP_VALIDITY_PERIOD_MINS,
  AUTH_URL,
} = require("../config/general");

const { HttpError } = require("../middleware/errorMiddleware");
const { v4: uuid } = require("uuid");

const createUserService = asyncHandler(async (userObj) => {
  const { email } = userObj;

  const resetPasswordKey = uuid();

  const resetPasswordKeyExpiry = new Date().setTime(
    new Date().getTime() + 60 * 60 * 1000 * 24 * 7 // valid for 1 week from now
  );

  const createdUser = await User.create({
    ...userObj,
    resetPasswordKey,
    resetPasswordKeyExpiry,
    active: true,
  });

  await sendEmailFromTemplate(
    "NEW USER CRM",
    {
      email,
      resetPasswordUrl: AUTH_URL + resetPasswordKey,
    },
    email
  );
  return createdUser.toObject();
});

const generateRegistrationOtpService = asyncHandler(async ({ email }) => {
  const user = await User.findOne({ email });

  if (user && !user.active) {
    const otpValidityPeriod = OTP_VALIDITY_PERIOD_MINS * 60 * 1000;
    const otpCooldownPeriod = OTP_COOLDOWN_PERIOD_MINS * 60 * 1000;
    const lastOtpSentAt =
      new Date(user.resetPasswordKeyExpiry).getTime() - otpValidityPeriod;

    if (
      !user.resetPasswordKey ||
      new Date().getTime() - lastOtpSentAt >= otpCooldownPeriod
    ) {
      const newTemporaryKey = await generateTemporaryKey();
      user.resetPasswordKey = newTemporaryKey;
      user.resetPasswordKeyExpiry = new Date().setTime(
        new Date().getTime() + otpValidityPeriod
      );

      await sendEmailFromTemplate(
        "Generate Registration OTP",
        {
          otp: newTemporaryKey,
        },
        email
      );
      await user.save();
    } else {
      throw new HttpError(
        "Please wait for a while before requesting a new OTP."
      );
    }
  }

  return { success: true };
});

const generateTemporaryKey = asyncHandler(async () => {
  let resetPasswordKey;
  while (true) {
    resetPasswordKey = crypto.randomBytes(3).toString("hex");
    let userWithMatchingKey = await User.findOne({
      resetPasswordKey,
      resetPasswordKeyExpiry: {
        $gt: new Date(new Date().getTime() - 15 * 60 * 1000),
      },
    });
    if (!userWithMatchingKey) return resetPasswordKey;
  }
});

const getUsersService = asyncHandler(
  async ({ filter, sort, query, pageNumber, pageSize }) => {
    const users = await User.find(filter ? filter : {}).sort(sort ? sort : {});
    return search(query, users, userSearchPaths, pageNumber, pageSize);
  }
);

const getUserByKeyService = asyncHandler(async (resetPasswordKey) => {
  const user = await User.findOne({ resetPasswordKey });
  if (!user) {
    throw new HttpError("Invalid token");
  }
  return user;
});

const registerService = asyncHandler(
  async ({ email, password, resetPasswordKey }) => {
    const user = await User.findOne({ email });

    if (user && !user.active) {
      if (user.resetPasswordKey !== resetPasswordKey) {
        throw new HttpError("Invalid OTP.");
      }

      if (new Date().getTime() > user.resetPasswordKeyExpiry.getTime()) {
        throw new HttpError("The OTP has expired. Generate another OTP.");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const userToPatch = {
        password: hashedPassword,
        active: true,
      };

      const updatedUser = await User.findOneAndUpdate({ email }, userToPatch, {
        new: true,
      });

      return {
        token: generateToken(updatedUser._id),
        ...updatedUser.toObject(),
      };
    }

    throw new HttpError(
      "An error occurred while registering. Please try again."
    );
  }
);

const loginService = asyncHandler(async ({ email, password }) => {
  const user = await User.findOne({ email });

  let unsuccessfulLoginAttemptBlockedMessage =
    "Too many unsuccessful login attempts. Please try again later.";

  // Check if account is locked due to too many login attempts
  if (user && user.lockUntil && user.lockUntil > Date.now()) {
    throw new HttpError(unsuccessfulLoginAttemptBlockedMessage);
  }

  if (!user || !user.active) {
    throw new HttpError("Invalid login credentials.");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    user.loginAttempts++;
    let failedMessageError = `Invalid Login Credentials. ${
      BLOCK_AFTER_UNSUCCESSFUL_LOGIN_ATTEMPTS_COUNT - user.loginAttempts
    } attempt(s) left.`;
    if (user.loginAttempts >= BLOCK_AFTER_UNSUCCESSFUL_LOGIN_ATTEMPTS_COUNT) {
      user.lockUntil =
        Date.now() +
        BLOCK_AFTER_UNSUCCESSFUL_LOGIN_ATTEMPTS_FOR_MINS * 60 * 1000;
      failedMessageError = unsuccessfulLoginAttemptBlockedMessage;
    }
    await user.save();
    throw new HttpError(failedMessageError);
  }

  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  return {
    token: generateToken(user._id),
    ...user.toObject(),
  };
});

const generateToken = (id, expiresIn = "30d") => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

const updateUserDetailsService = asyncHandler(
  async (userObj, requestingUserObj = false) => {
    let email = userObj.email || requestingUserObj?.email;
    const user = await User.findOne({ email });
    if (!user) {
      throw new HttpError("The user with the specified email doesn't exist.");
    }
    const updatedUser = await User.findOneAndUpdate({ email }, userObj, {
      new: true,
    });
    return updatedUser.toObject();
  }
);

const sendPasswordResetLinkService = asyncHandler(async ({ email }) => {
  const user = await User.findOne({ email });
  if (user && user.active) {
    const otpValidityPeriod = OTP_VALIDITY_PERIOD_MINS * 60 * 1000;
    const otpCooldownPeriod = OTP_COOLDOWN_PERIOD_MINS * 60 * 1000;
    const lastOtpSentAt =
      new Date(user.resetPasswordKeyExpiry).getTime() - otpValidityPeriod;

    // Check if cooldown period is over
    if (
      !user.resetPasswordKey ||
      new Date().getTime() - lastOtpSentAt >= otpCooldownPeriod
    ) {
      const newTemporaryKey = uuid();
      user.resetPasswordKey = newTemporaryKey;
      user.resetPasswordKeyExpiry = new Date().setTime(
        new Date().getTime() + otpValidityPeriod
      );

      await sendEmailFromTemplate(
        "Generate Password Reset Link",
        {
          email,
          resetPasswordUrl: AUTH_URL + newTemporaryKey,
        },
        user.email
      );
      await user.save();
    } else {
      // The cooldown period hasn't passed yet
      throw new HttpError(
        "Please wait for a while before requesting a new OTP."
      );
    }
  }

  return { success: true };
});

const changePasswordService = asyncHandler(
  async ({ user, oldPassword, newPassword }) => {
    if (!(await bcrypt.compare(oldPassword, user.password))) {
      throw new HttpError("The old Password is incorrect");
    }
    const newPasswordHashed = await bcrypt.hash(
      newPassword,
      await bcrypt.genSalt(10)
    );
    const updatedUser = await User.findByIdAndUpdate(
      user._id.toString(),
      { password: newPasswordHashed },
      { new: true }
    );
    return updatedUser.toObject();
  }
);

const resetPasswordService = asyncHandler(
  async ({ email, resetPasswordKey, password }) => {
    const user = await User.findOne({ email });

    if (!user) {
      throw new HttpError("User not found");
    }
    if (
      user.resetPasswordKey !== resetPasswordKey ||
      new Date().getTime() > user.resetPasswordKeyExpiry.getTime()
    ) {
      throw new HttpError("The link has expired.");
    }

    const newPasswordHashed = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10)
    );

    const resetPasswordKeyExpiry = new Date();

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { password: newPasswordHashed, resetPasswordKeyExpiry },
      { new: true }
    );
    return updatedUser.toObject();
  }
);

const deleteUserService = asyncHandler(
  async (reqBody, requestingUserEmail = false) => {
    const { email } = reqBody;
    const user = await User.findOne({ email }); // Shorten variable name

    if (requestingUserEmail && email === requestingUserEmail) {
      throw new HttpError("You can't delete your own account as an admin.");
    }

    if (!user) {
      throw new HttpError("User with the given email was not found.");
    }

    if (user.roles.includes(ROLES.ADMIN)) {
      const numberOfAdmins = await User.count({ role: ROLES.ADMIN });

      if (numberOfAdmins === 1) {
        throw new HttpError("At least one account must remain as an admin.");
      }
    }

    // Delete the user
    await User.deleteOne({ _id: user._id });

    return { _id: user._id };
  }
);

module.exports = {
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
};
