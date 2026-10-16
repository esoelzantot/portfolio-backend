const httpStatus = require("../utils/httpStatus");
const HttpError = require("../utils/httpError");
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const [scheme, token] = (authHeader || "").split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      HttpError.create(
        "token is required",
        httpStatus.UNAUTHORIZED,
        httpStatus.FAIL
      )
    );
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET_KEY, {
      algorithms: ["HS256"],
    });
    next();
  } catch (error) {
    return next(
      HttpError.create(
        "unauthorized user",
        httpStatus.UNAUTHORIZED,
        httpStatus.FAIL
      )
    );
  }
};

module.exports = verifyToken;
