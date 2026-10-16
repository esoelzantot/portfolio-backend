const mongoose = require("mongoose");

// strips $-operators from query filters (blocks NoSQL injection like {"$ne": null})
mongoose.set("sanitizeFilter", true);

let connection = null;

// reuses one connection per process: on serverless (Vercel) the same instance
// serves many requests, so we must not reconnect on every request
const connectDB = () => {
  if (!connection) {
    connection = mongoose
      .connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 })
      .catch((error) => {
        connection = null; // allow a retry on the next request
        throw error;
      });
  }
  return connection;
};

module.exports = connectDB;
