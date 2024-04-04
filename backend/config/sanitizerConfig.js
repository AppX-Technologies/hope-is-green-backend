const sanitizerConfig = {
  User: {
    All: {
      mode: "blacklist",
      paths: [
        "password",
        "resetPasswordKey",
        "resetPasswordKeyExpiry",
        "loginAttempts",
        "lockUntil",
        "__v",
      ],
    },
  },
  // other models here...
};

module.exports = sanitizerConfig;
