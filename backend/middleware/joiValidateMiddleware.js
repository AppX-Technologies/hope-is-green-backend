const asyncHandler = require("express-async-handler");

const joiValidate = (joiSchemas) => {
  return asyncHandler(async (req, res, next) => {
    if (joiSchemas) {
      const schema = joiSchemas[req.user?.role] || joiSchemas["All"]; // select schema based on role, or try to find a global schema
      if (schema) {
        const { error } = schema.validate(req.body);
        if (error) {
          res.status(400);
          throw new Error(error.details[0].message);
        }
      }
    }
    next();
  });
};

module.exports = joiValidate;
