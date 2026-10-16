const Home = require("../models/home.model");
const httpStatus = require("../utils/httpStatus");
const HttpError = require("../utils/httpError");
const pick = require("../utils/pick");
const { removeUpload } = require("../utils/uploads");
const asyncWrapper = require("../middlewares/asyncWrapper");

const UPDATABLE_FIELDS = ["name", "title", "description", "imageSrc", "facebook", "linkedin", "github"];

const notFound = () =>
  HttpError.create("home data not found", httpStatus.NOT_FOUND, httpStatus.FAIL);

const getHomeData = asyncWrapper(async (req, res, next) => {
  const home = await Home.findOne({}, { __v: false }).lean();

  if (!home) return next(notFound());

  res.json({
    status: httpStatus.SUCCESS,
    data: { home },
  });
});

const updateHomeData = asyncWrapper(async (req, res, next) => {
  const updates = pick(req.body, UPDATABLE_FIELDS);

  const previous = await Home.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: false, runValidators: true }
  );

  if (!previous) return next(notFound());

  if (updates.imageSrc && updates.imageSrc !== previous.imageSrc) {
    await removeUpload(previous.imageSrc);
  }

  const updatedData = await Home.findById(req.params.id, { __v: false }).lean();

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: { home: updatedData },
  });
});

module.exports = {
  getHomeData,
  updateHomeData,
};
