const Service = require("../models/service.model");
const httpStatus = require("../utils/httpStatus");
const HttpError = require("../utils/httpError");
const pick = require("../utils/pick");
const asyncWrapper = require("../middlewares/asyncWrapper");

const FIELDS = ["title", "modalTitle", "modalDescription", "provisions"];

const notFound = () =>
  HttpError.create("service not found", httpStatus.NOT_FOUND, httpStatus.FAIL);

const getServices = asyncWrapper(async (req, res, next) => {
  const services = await Service.find({}, { __v: false }).lean();
  res.json({
    status: httpStatus.SUCCESS,
    data: { services },
  });
});

const getService = asyncWrapper(async (req, res, next) => {
  const service = await Service.findById(req.params.id, { __v: false }).lean();
  if (!service) return next(notFound());

  return res.json({
    status: httpStatus.SUCCESS,
    data: { service },
  });
});

const addService = asyncWrapper(async (req, res, next) => {
  const newService = await Service.create(pick(req.body, FIELDS));
  res.status(201).json({
    status: httpStatus.SUCCESS,
    data: { service: newService },
  });
});

const updateService = asyncWrapper(async (req, res, next) => {
  const updatedService = await Service.findByIdAndUpdate(
    req.params.id,
    { $set: pick(req.body, FIELDS) },
    { new: true, runValidators: true, projection: { __v: false } }
  ).lean();

  if (!updatedService) return next(notFound());

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: { service: updatedService },
  });
});

const deleteService = asyncWrapper(async (req, res, next) => {
  const deletedService = await Service.findByIdAndDelete(req.params.id);
  if (!deletedService) return next(notFound());

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: null,
  });
});

module.exports = {
  getServices,
  getService,
  addService,
  updateService,
  deleteService,
};
