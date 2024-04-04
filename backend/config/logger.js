const { transports, format } = require("winston");
require("winston-mongodb");
const expressWinston = require("express-winston");

const requestLogger = expressWinston.logger({
  transports: [
    new transports.MongoDB({
      db: process.env.MONGO_URI,
      options: {
        useUnifiedTopology: true,
      },
      collection: "logs",
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
  format: format.combine(format.timestamp(), format.json()),
  meta: true,
  expressFormat: true,
});

const errorLogger = expressWinston.errorLogger({
  transports: [
    new transports.MongoDB({
      db: process.env.MONGO_URI,
      options: {
        useUnifiedTopology: true,
      },
      collection: "errors",
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
  format: format.combine(format.timestamp(), format.json()),
  meta: true,
  expressFormat: true,
});

module.exports = { requestLogger, errorLogger };
