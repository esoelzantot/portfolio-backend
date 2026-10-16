const httpStatus = require("../utils/httpStatus");
const HttpError = require("../utils/httpError");

const allowedTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        HttpError.create(
          "this user is not authorized",
          httpStatus.FORBIDDEN,
          httpStatus.FAIL
        )
      );
    }
    next();
  };
};

module.exports = allowedTo;
