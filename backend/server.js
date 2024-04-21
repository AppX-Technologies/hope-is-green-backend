require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimiter = require("./middleware/rateLimitingMiddleware");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");

const { errorHandler } = require("./middleware/errorMiddleware");

require("./config/db");

const port = process.env.PORT || 5000;
const { errorLogger } = require("./config/logger");
const userRoutes = require("./routes/userRoutes");
const clubRoutes = require("./routes/clubRoutes");
const productRoutes = require("./routes/productRoutes");
const fileRoutes = require("./routes/fileRoutes");
const appChoiceRoutes = require("./routes/appChoiceRoutes");
const orderRoutes = require("./routes/orderRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const filterRoutes = require("./routes/filterRoutes");

const app = express();
app.use(cookieParser());
app.set("trust proxy", 1);

// Set up CORS configuration
const corsOptions = {
  origin: process.env.BASEURL,
  credentials: true, // Allow cookies
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(errorLogger);
app.use(rateLimiter);
app.use(
  mongoSanitize({
    allowDots: true,
  })
);

const isTestServer = process.env.IS_TEST_SERVER;
const routePrefix = isTestServer ? `test-` : "";

app.use(`/${routePrefix}api/users`, userRoutes);
app.use(`/${routePrefix}api/clubs`, clubRoutes);
app.use(`/${routePrefix}api/products`, productRoutes);
app.use(`/${routePrefix}api/files`, fileRoutes);
app.use(`/${routePrefix}api/app-choices`, appChoiceRoutes);
app.use(`/${routePrefix}api/filters`, filterRoutes);
app.use(`/${routePrefix}api/orders`, orderRoutes);
app.use(`/${routePrefix}api/discussions`, discussionRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Bravo! Server started on port ${port}`);
});
