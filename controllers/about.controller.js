const About = require("../models/about.model");
const httpStatus = require("../utils/httpStatus");
const HttpError = require("../utils/httpError");
const pick = require("../utils/pick");
const { removeUpload } = require("../utils/uploads");
const asyncWrapper = require("../middlewares/asyncWrapper");

const UPDATABLE_FIELDS = ["name", "title", "description", "imageSrc", "cvURL", "experienceYears", "successProjects"];

const notFound = () =>
  HttpError.create("about data not found", httpStatus.NOT_FOUND, httpStatus.FAIL);

const getAboutData = asyncWrapper(async (req, res, next) => {
  const about = await About.findOne({}, { __v: false }).lean();

  if (!about) return next(notFound());

  res.json({
    status: httpStatus.SUCCESS,
    data: { about },
  });
});

const updateAboutData = asyncWrapper(async (req, res, next) => {
  const updates = pick(req.body, UPDATABLE_FIELDS);

  const previous = await About.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: false, runValidators: true }
  );

  if (!previous) return next(notFound());

  if (updates.imageSrc && updates.imageSrc !== previous.imageSrc) {
    await removeUpload(previous.imageSrc);
  }

  const updatedData = await About.findById(req.params.id, { __v: false }).lean();

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: { about: updatedData },
  });
});

module.exports = {
  getAboutData,
  updateAboutData,
};
