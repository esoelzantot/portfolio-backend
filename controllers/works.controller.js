const Work = require("../models/work.model");
const httpStatus = require("../utils/httpStatus");
const HttpError = require("../utils/httpError");
const pick = require("../utils/pick");
const asyncWrapper = require("../middlewares/asyncWrapper");

const FIELDS = ["mainTitle", "subTitle", "calendar"];

const notFound = () =>
  HttpError.create("work not found", httpStatus.NOT_FOUND, httpStatus.FAIL);

const getWorks = asyncWrapper(async (req, res, next) => {
  const works = await Work.find({}, { __v: false }).lean();
  res.json({
    status: httpStatus.SUCCESS,
    data: { works },
  });
});

const getWork = asyncWrapper(async (req, res, next) => {
  const work = await Work.findById(req.params.id, { __v: false }).lean();
  if (!work) return next(notFound());

  return res.json({
    status: httpStatus.SUCCESS,
    data: { work },
  });
});

const addWork = asyncWrapper(async (req, res, next) => {
  const newWork = await Work.create(pick(req.body, FIELDS));
  res.status(201).json({
    status: httpStatus.SUCCESS,
    data: { work: newWork },
  });
});

const updateWork = asyncWrapper(async (req, res, next) => {
  const updatedWork = await Work.findByIdAndUpdate(
    req.params.id,
    { $set: pick(req.body, FIELDS) },
    { new: true, runValidators: true, projection: { __v: false } }
  ).lean();

  if (!updatedWork) return next(notFound());

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: { work: updatedWork },
  });
});

const deleteWork = asyncWrapper(async (req, res, next) => {
  const deletedWork = await Work.findByIdAndDelete(req.params.id);
  if (!deletedWork) return next(notFound());

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: null,
  });
});

module.exports = {
  getWorks,
  getWork,
  addWork,
  updateWork,
  deleteWork,
};
