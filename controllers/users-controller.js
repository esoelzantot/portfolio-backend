const bcrypt = require("bcrypt");

const User = require("../models/user.model");
const httpStatus = require("../utils/httpStatus");
const HttpError = require("../utils/httpError");
const userRoles = require("../utils/userRoles");
const generateJWT = require("../utils/generateJWT");
const asyncWrapper = require("../middlewares/asyncWrapper");

const BCRYPT_ROUNDS = 12;
const MAX_PAGE_SIZE = 50;

const toPositiveInt = (value, fallback) => {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const getAllUsers = asyncWrapper(async (req, res, next) => {
  const limit = Math.min(toPositiveInt(req.query.limit, 10), MAX_PAGE_SIZE);
  const page = toPositiveInt(req.query.page, 1);
  const skip = (page - 1) * limit;

  const users = await User.find({}, { __v: false, token: false })
    .sort({ _id: 1 })
    .limit(limit)
    .skip(skip)
    .lean();

  res.json({
    status: httpStatus.SUCCESS,
    data: { users },
  });
});

const register = asyncWrapper(async (req, res, next) => {
  const { firstName, lastName, email, password, avatar } = req.body;

  if (![firstName, lastName, email, password].every(isNonEmptyString)) {
    return next(
      HttpError.create(
        "firstName, lastName, email and password are required",
        httpStatus.BAD_REQUEST,
        httpStatus.FAIL
      )
    );
  }

  if (password.length < 8) {
    return next(
      HttpError.create(
        "password must be at least 8 characters",
        httpStatus.BAD_REQUEST,
        httpStatus.FAIL
      )
    );
  }

  // the very first account becomes the admin; after that only an admin can
  // create accounts (enforced in the route) and pick their role
  let role = userRoles.USER;
  if (req.isFirstUser) {
    role = userRoles.ADMIN;
  } else if (Object.values(userRoles).includes(req.body.role)) {
    role = req.body.role;
  }

  const user = await User.exists({ email: email.trim().toLowerCase() });
  if (user) {
    return next(
      HttpError.create(
        "user already exists",
        httpStatus.CONFLICT,
        httpStatus.FAIL
      )
    );
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
    ...(typeof avatar === "string" && { avatar }),
  });

  res.status(201).json({
    status: httpStatus.SUCCESS,
    data: { user: newUser },
  });
});

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return next(
      HttpError.create(
        "please provide email and password",
        httpStatus.BAD_REQUEST,
        httpStatus.FAIL
      )
    );
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+password"
  );

  // same response for unknown email and wrong password (no user enumeration)
  const isMatch = user ? await bcrypt.compare(password, user.password) : false;

  if (!isMatch) {
    return next(
      HttpError.create(
        "invalid credentials",
        httpStatus.UNAUTHORIZED,
        httpStatus.FAIL
      )
    );
  }

  const token = generateJWT({
    email: user.email,
    _id: user._id,
    role: user.role,
  });

  res.status(200).json({
    status: httpStatus.SUCCESS,
    data: { token },
  });
});

module.exports = {
  getAllUsers,
  login,
  register,
};
