const Contact = require("../models/contact.model");
const httpStatus = require("../utils/httpStatus");
const HttpError = require("../utils/httpError");
const pick = require("../utils/pick");
const asyncWrapper = require("../middlewares/asyncWrapper");

const UPDATABLE_FIELDS = ["phone", "email", "location"];

const notFound = () =>
  HttpError.create("contact data not found", httpStatus.NOT_FOUND, httpStatus.FAIL);

const getContactData = asyncWrapper(async (req, res, next) => {
  const contact = await Contact.findOne({}, { __v: false }).lean();

  if (!contact) return next(notFound());

  res.json({
    status: httpStatus.SUCCESS,
    data: { contact },
  });
});

const updateContactData = asyncWrapper(async (req, res, next) => {
  const updatedData = await Contact.findByIdAndUpdate(
    req.params.id,
    { $set: pick(req.body, UPDATABLE_FIELDS) },
    { new: true, runValidators: true, projection: { __v: false } }
  ).lean();

  if (!updatedData) return next(notFound());

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: { contact: updatedData },
  });
});

module.exports = {
  getContactData,
  updateContactData,
};
