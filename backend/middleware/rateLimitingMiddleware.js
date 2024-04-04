const rateLimit = require("express-rate-limit");
const {
  RATE_LIMIT_WINDOW_SIZE_SECS,
  RATE_LIMIT_REQUESTS_PER_WINDOW,
} = require("../config/general");

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_SIZE_SECS * 1000,
  max: RATE_LIMIT_REQUESTS_PER_WINDOW,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  trustProxy: true,
  handler: function (req, res) {
    res.status(429);
    throw new Error("Too many requests, please try again later.");
  },
});

console.log(
  `Rate limits active: ${RATE_LIMIT_REQUESTS_PER_WINDOW} requests allowed every ${RATE_LIMIT_WINDOW_SIZE_SECS} seconds.`
);

module.exports = apiLimiter;
