const Education = require("../models/education.model");
const httpStatus = require("../utils/httpStatus");
const HttpError = require("../utils/httpError");
const pick = require("../utils/pick");
const asyncWrapper = require("../middlewares/asyncWrapper");

const FIELDS = ["mainTitle", "subTitle", "calendar"];

const notFound = () =>
  HttpError.create("education not found", httpStatus.NOT_FOUND, httpStatus.FAIL);

const getEducations = asyncWrapper(async (req, res, next) => {
  const educations = await Education.find({}, { __v: false }).lean();
  res.json({
    status: httpStatus.SUCCESS,
    data: { educations },
  });
});

const getEducation = asyncWrapper(async (req, res, next) => {
  const education = await Education.findById(req.params.id, { __v: false }).lean();
  if (!education) return next(notFound());

  return res.json({
    status: httpStatus.SUCCESS,
    data: { education },
  });
});

const addEducation = asyncWrapper(async (req, res, next) => {
  const newEducation = await Education.create(pick(req.body, FIELDS));
  res.status(201).json({
    status: httpStatus.SUCCESS,
    data: { education: newEducation },
  });
});

const updateEducation = asyncWrapper(async (req, res, next) => {
  const updatedEducation = await Education.findByIdAndUpdate(
    req.params.id,
    { $set: pick(req.body, FIELDS) },
    { new: true, runValidators: true, projection: { __v: false } }
  ).lean();

  if (!updatedEducation) return next(notFound());

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: { education: updatedEducation },
  });
});

const deleteEducation = asyncWrapper(async (req, res, next) => {
  const deletedEducation = await Education.findByIdAndDelete(req.params.id);
  if (!deletedEducation) return next(notFound());

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: null,
  });
});

module.exports = {
  getEducations,
  getEducation,
  addEducation,
  updateEducation,
  deleteEducation,
};
