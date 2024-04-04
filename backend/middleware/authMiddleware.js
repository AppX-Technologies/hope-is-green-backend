const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

// Middleware to protect routes and optionally check for specific roles
const protect = (allowedRoles) => {
  const shouldPerformRoleCheck = !!allowedRoles;
  // Ensure allowedRoles is an array for easier processing
  if (!Array.isArray(allowedRoles)) allowedRoles = [allowedRoles];

  return asyncHandler(async (req, res, next) => {
    const authToken = req.cookies["user-token"];
    try {
      // Decode the JWT from the auth token
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
      let user = await User.findById(decoded.id);
      const updatingAs = req.headers["updating-as"];

      // If the logged-in user is an admin and the updating-as header is present, update the user object.
      if (user.role === "Admin" && updatingAs) {
        user = await User.findById(updatingAs);
      }

      // If no user is found or they are not authorized, throw an error
      if (!user) {
        res.status(400);
        throw new Error("Unauthorized.");
      }

      // Assign the user object to the request
      req.user = user.toObject();

      // If role checking is enabled and the user's role is not in the allowed roles, throw an error
      if (
        shouldPerformRoleCheck &&
        !allowedRoles.some((r) => req.user.roles.includes(r))
      ) {
        res.status(403);
        throw new Error(
          `Only ${allowedRoles.join(", ")} can perform this action.`
        );
      }

      next(); // Proceed to the next middleware if no errors are thrown
    } catch (e) {
      // Catch any errors (e.g., JWT verification errors) and return an authorization error
      res.status(401);
      throw new Error("Not authorized.");
    }
  });
};

module.exports = { protect };
