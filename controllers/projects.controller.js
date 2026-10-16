const Project = require("../models/project.model");
const httpStatus = require("../utils/httpStatus");
const HttpError = require("../utils/httpError");
const pick = require("../utils/pick");
const { removeUpload } = require("../utils/uploads");
const asyncWrapper = require("../middlewares/asyncWrapper");

const FIELDS = [
  "title",
  "modalTitle",
  "description",
  "githubURL",
  "features",
  "imgSrc",
];

const notFound = () =>
  HttpError.create("project not found", httpStatus.NOT_FOUND, httpStatus.FAIL);

// multipart/form-data sends arrays as a single string ("a,b,c" or a JSON array)
const normalizeFeatures = (features) => {
  if (Array.isArray(features) || typeof features !== "string") return features;

  const trimmed = features.trim();
  if (trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through to comma split
    }
  }
  return trimmed
    .split(",")
    .map((feature) => feature.trim())
    .filter(Boolean);
};

const readBody = (body) => {
  const data = pick(body, FIELDS);
  if (data.features !== undefined) {
    data.features = normalizeFeatures(data.features);
  }
  return data;
};

const getProjects = asyncWrapper(async (req, res, next) => {
  const projects = await Project.find({}, { __v: false }).lean();
  res.json({
    status: httpStatus.SUCCESS,
    data: { projects },
  });
});

const getProject = asyncWrapper(async (req, res, next) => {
  const project = await Project.findById(req.params.id, { __v: false }).lean();
  if (!project) return next(notFound());

  return res.json({
    status: httpStatus.SUCCESS,
    data: { project },
  });
});

const addProject = asyncWrapper(async (req, res, next) => {
  const newProject = await Project.create(readBody(req.body));
  res.status(201).json({
    status: httpStatus.SUCCESS,
    data: { project: newProject },
  });
});

const updateProject = asyncWrapper(async (req, res, next) => {
  const updates = readBody(req.body);

  const previous = await Project.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: false, runValidators: true }
  );

  if (!previous) return next(notFound());

  if (updates.imgSrc && updates.imgSrc !== previous.imgSrc) {
    await removeUpload(previous.imgSrc);
  }

  const updatedProject = await Project.findById(req.params.id, {
    __v: false,
  }).lean();

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: { project: updatedProject },
  });
});

const deleteProject = asyncWrapper(async (req, res, next) => {
  const deletedProject = await Project.findByIdAndDelete(req.params.id);
  if (!deletedProject) return next(notFound());

  await removeUpload(deletedProject.imgSrc);

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: null,
  });
});

module.exports = {
  getProjects,
  getProject,
  addProject,
  updateProject,
  deleteProject,
};
