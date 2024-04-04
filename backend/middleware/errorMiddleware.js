const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode || 500;

  if (statusCode >= 200 && statusCode < 300) {
    statusCode = 500;
  }

  let message = "";

  switch (err.code) {
    case 11000:
      statusCode = 400;
      message = `The provided ${
        Object.keys(err.keyValue)[0]
      } already exists in our system`;
      break;
  }

  res.status(statusCode);
  res.json({
    message: message || err.message,
    stack: process.env.NODE_ENV == "production" ? null : err.stack,
  });
};

class HttpError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = {
  errorHandler,
  HttpError,
};
