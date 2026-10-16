require("dotenv").config();

const fs = require("fs/promises");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const multer = require("multer");

const httpStatus = require("./utils/httpStatus");
const { UPLOADS_ROOT } = require("./utils/uploads");

// fail fast on missing / weak configuration
const { MONGO_URL, JWT_SECRET_KEY, PORT = 5000, CORS_ORIGIN, TRUST_PROXY } =
  process.env;
if (!MONGO_URL) throw new Error("MONGO_URL is not set");
if (!JWT_SECRET_KEY || JWT_SECRET_KEY.length < 32) {
  throw new Error("JWT_SECRET_KEY must be set and at least 32 characters");
}

// strips $-operators from query filters (blocks NoSQL injection like {"$ne": null})
mongoose.set("sanitizeFilter", true);

const app = express();

app.disable("x-powered-by");

// behind a hosting proxy (Render, Railway, nginx...) so req.ip is the real
// client IP; without it the login rate limit would be shared by everyone
if (TRUST_PROXY) {
  app.set("trust proxy", TRUST_PROXY === "true" ? true : Number(TRUST_PROXY) || TRUST_PROXY);
}
app.use(
  helmet({
    // the portfolio and dashboard load images from this API on another origin
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    // comma separated list, e.g. "http://localhost:4200,https://my-site.com"
    origin: CORS_ORIGIN ? CORS_ORIGIN.split(",").map((o) => o.trim()) : true,
  })
);
app.use(express.json({ limit: "100kb" }));

app.use(
  "/uploads",
  express.static(UPLOADS_ROOT, { dotfiles: "deny", index: false })
);

// Routers
app.use("/api/users", require("./routes/users.route"));

app.use("/api/home", require("./routes/home.route"));
app.use("/api/about", require("./routes/about.route"));
app.use("/api/contact", require("./routes/contact.route"));

app.use("/api/services", require("./routes/services.route"));
app.use("/api/projects", require("./routes/projects.route"));
app.use("/api/educations", require("./routes/educations.route"));
app.use("/api/works", require("./routes/works.route"));
app.use("/api/skills", require("./routes/skills.route"));

// global middleware for not found routes
app.use((req, res) => {
  return res.status(httpStatus.NOT_FOUND).json({
    status: httpStatus.ERROR,
    message: "this route does not exist",
    data: null,
    code: httpStatus.NOT_FOUND,
  });
});

// turns known library errors into proper 4xx responses
const normalizeError = (error) => {
  if (error.statusCode) return error;

  if (error instanceof mongoose.Error.CastError) {
    return { statusCode: 400, message: `invalid ${error.path}` };
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 400,
      message: "validation failed",
      details: Object.values(error.errors).map((e) => e.message),
    };
  }
  if (error.code === 11000) {
    return { statusCode: 409, message: "duplicate value" };
  }
  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    return {
      statusCode: tooLarge ? 413 : 400,
      message: tooLarge ? "file is too large (max 2MB)" : error.message,
    };
  }
  if (error.type === "entity.parse.failed") {
    return { statusCode: 400, message: "invalid JSON body" };
  }
  if (error.type === "entity.too.large") {
    return { statusCode: 413, message: "request body is too large" };
  }

  // unexpected: log it, don't leak internals to the client
  console.error(error);
  return { statusCode: 500, message: "internal server error" };
};

// global error handler
app.use(async (error, req, res, next) => {
  // a file may already be on disk when the request fails
  if (req.file) await fs.unlink(req.file.path).catch(() => {});

  const { statusCode, message, details } = normalizeError(error);

  res.status(statusCode).json({
    status:
      error.statusText ||
      (statusCode < 500 ? httpStatus.FAIL : httpStatus.ERROR),
    message,
    ...(details && { details }),
    data: null,
    code: statusCode,
  });
});

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("MongoDB connected...");
    app.listen(PORT, () => {
      console.log(`Server listening at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
