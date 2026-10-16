const jwt = require("jsonwebtoken");

const generateJWT = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

module.exports = generateJWT;
