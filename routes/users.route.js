const express = require("express");
const rateLimit = require("express-rate-limit");

const createMulter = require("../middlewares/createMulter");
const verifyToken = require("../middlewares/verifyToken");
const allowedTo = require("../middlewares/allowedTo");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatus = require("../utils/httpStatus");
const userRoles = require("../utils/userRoles");
const User = require("../models/user.model");
const usersController = require("../controllers/users-controller");

const upload = createMulter("users");
const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    status: httpStatus.FAIL,
    message: "too many attempts, please try again later",
    data: null,
    code: httpStatus.TOO_MANY_REQUESTS,
  },
});

// open only while the database has no users (to create the first admin);
// after that, registering a new account requires an admin token
const canRegister = asyncWrapper(async (req, res, next) => {
  const hasUsers = await User.exists({});
  if (!hasUsers) {
    req.isFirstUser = true;
    return next();
  }

  verifyToken(req, res, (error) => {
    if (error) return next(error);
    allowedTo(userRoles.ADMIN)(req, res, next);
  });
});

router
  .route("/")
  .get(verifyToken, allowedTo(userRoles.ADMIN), usersController.getAllUsers);

router.route("/login").post(authLimiter, usersController.login);

router
  .route("/register")
  .post(
    authLimiter,
    canRegister,
    upload.single("avatar"),
    usersController.register
  );

module.exports = router;
