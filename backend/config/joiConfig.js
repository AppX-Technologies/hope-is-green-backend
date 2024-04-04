const Joi = require("joi");

const { ALL_ROLES } = require("../config/general");

const createUserJoiSchemas = {
  Admin: Joi.object({
    name: Joi.string().trim().allow(""),
    email: Joi.string().trim().email().required(),
    phone: Joi.string().trim().allow(""),
    specialRoles: Joi.object({
      crm: Joi.string().trim(),
      app: Joi.string().trim(),
    }),
    role: Joi.string()
      .valid(...ALL_ROLES)
      .required(),
  }),
};

const loginJoiSchemas = {
  All: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(5).required(),
  }),
};

const registerJoiSchemas = {
  All: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(5).required(),
    name: Joi.string().trim().allow(""),
    phone: Joi.string().trim().allow(""),
    resetPasswordKey: Joi.string().required(),
  }),
};

const updateUserDetailsJoiSchemas = {
  Admin: Joi.object({
    email: Joi.string().trim().email(),
    name: Joi.string().trim().allow(""),
    phone: Joi.string().trim().allow(""),
    role: Joi.string().valid(...ALL_ROLES),
    crew: Joi.string().trim().allow(""),
    specialRoles: Joi.object({
      crm: Joi.string().trim(),
      app: Joi.string().trim(),
    }),
    isEnabled: Joi.boolean(),
  }),
  Staff: Joi.object({
    email: Joi.forbidden(),
    name: Joi.string().trim().allow(""),
    phone: Joi.string().trim().allow(""),
    role: Joi.string().valid(...ALL_ROLES),
    crew: Joi.string().trim().allow(""),
    specialRoles: Joi.object({
      crm: Joi.string().trim(),
      app: Joi.string().trim(),
    }),
    isEnabled: Joi.boolean(),
  }),
};

const sendPasswordResetLinkJoiSchemas = {
  All: Joi.object({
    email: Joi.string().trim().email().required(),
  }),
};

const generateRegistrationOTPJoiSchemas = sendPasswordResetLinkJoiSchemas;

const changePasswordJoiSchemas = {
  All: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(5).required(),
  }),
};

const resetPasswrodJoiSchemas = {
  All: Joi.object({
    email: Joi.string().required(),
    resetPasswordKey: Joi.string().required(),
    password: Joi.string().min(5).required(),
  }),
};

module.exports = {
  createUserJoiSchemas,
  loginJoiSchemas,
  registerJoiSchemas,
  updateUserDetailsJoiSchemas,
  sendPasswordResetLinkJoiSchemas,
  generateRegistrationOTPJoiSchemas,
  changePasswordJoiSchemas,
  resetPasswrodJoiSchemas,
};
