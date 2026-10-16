require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const multer = require("multer");

const httpStatus = require("./utils/httpStatus");
const connectDB = require("./utils/db");
const { removeUpload } = require("./utils/uploads");

const {
  MONGO_URL,
  JWT_SECRET_KEY,
  BLOB_READ_WRITE_TOKEN,
  PORT = 5000,
  CORS_ORIGIN,
  TRUST_PROXY,
} = process.env;

// started with "node index.js" (npm start / npm run dev), not imported by Vercel
const runsStandalone = require.main === module && !process.env.VERCEL;

// check configuration (only variable NAMES are reported, never their values)
const configErrors = [];
if (!MONGO_URL) configErrors.push("MONGO_URL is not set");
if (!BLOB_READ_WRITE_TOKEN) configErrors.push("BLOB_READ_WRITE_TOKEN is not set");
if (!JWT_SECRET_KEY || JWT_SECRET_KEY.length < 32) {
  configErrors.push("JWT_SECRET_KEY must be set and at least 32 characters");
}
if (configErrors.length) {
  // locally: stop right away. On Vercel a throw here only shows an opaque
  // FUNCTION_INVOCATION_FAILED, so we answer every request with the reason instead
  if (runsStandalone) throw new Error(configErrors.join("; "));
  console.error("server misconfigured:", configErrors.join("; "));
}

// optional, local dev only: some Windows setups (VPN / DNS clients) make Node
// resolve DNS through 127.0.0.1, which breaks "mongodb+srv://" SRV lookups
if (process.env.DNS_SERVERS) {
  require("dns").setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
}

const app = express();

app.disable("x-powered-by");

if (configErrors.length) {
  app.use((req, res) =>
    res.status(httpStatus.INTERNAL_SERVER).json({
      status: httpStatus.ERROR,
      message: "server misconfigured, check the environment variables",
      details: configErrors,
      data: null,
      code: httpStatus.INTERNAL_SERVER,
    })
  );
}

// behind a hosting proxy (Vercel, Render, nginx...) so req.ip is the real
// client IP; without it the login rate limit would be shared by everyone
if (TRUST_PROXY) {
  app.set("trust proxy", TRUST_PROXY === "true" ? true : Number(TRUST_PROXY) || TRUST_PROXY);
}
app.use(helmet());
app.use(
  cors({
    // comma separated list, e.g. "http://localhost:4200,https://my-site.com"
    origin: CORS_ORIGIN ? CORS_ORIGIN.split(",").map((o) => o.trim()) : true,
  })
);
app.use(express.json({ limit: "100kb" }));

// make sure MongoDB is connected before any route runs
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

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
  if (error instanceof mongoose.Error.MongooseServerSelectionError) {
    console.error("database unavailable:", error.message);
    return { statusCode: 503, message: "database unavailable" };
  }

  // unexpected: log it, don't leak internals to the client
  console.error(error);
  return { statusCode: 500, message: "internal server error" };
};

// global error handler
app.use(async (error, req, res, next) => {
  // an image may already be uploaded when the request fails
  if (req.uploadedImage) await removeUpload(req.uploadedImage);

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

// Vercel imports this file and runs the exported app as a serverless function;
// locally (npm start / npm run dev) we start a normal HTTP server
if (runsStandalone) {
  connectDB()
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
}

module.exports = app;
