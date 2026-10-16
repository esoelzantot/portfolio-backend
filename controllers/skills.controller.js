const Skill = require("../models/skill.model");
const httpStatus = require("../utils/httpStatus");
const HttpError = require("../utils/httpError");
const pick = require("../utils/pick");
const { removeUpload } = require("../utils/uploads");
const asyncWrapper = require("../middlewares/asyncWrapper");

const SKILL_FIELDS = ["category", "experience", "skillsList"];
const ITEM_FIELDS = ["name", "image"];

const skillNotFound = () =>
  HttpError.create("skill not found", httpStatus.NOT_FOUND, httpStatus.FAIL);

const itemNotFound = () =>
  HttpError.create(
    "skill item not found",
    httpStatus.NOT_FOUND,
    httpStatus.FAIL
  );

// CRUD operations for the main skills
const getSkills = asyncWrapper(async (req, res, next) => {
  const skills = await Skill.find({}, { __v: false }).lean();
  res.json({
    status: httpStatus.SUCCESS,
    data: { skills },
  });
});

const getSkill = asyncWrapper(async (req, res, next) => {
  const skill = await Skill.findById(req.params.id, { __v: false }).lean();
  if (!skill) return next(skillNotFound());

  return res.json({
    status: httpStatus.SUCCESS,
    data: { skill },
  });
});

const addSkill = asyncWrapper(async (req, res, next) => {
  const newSkill = await Skill.create(pick(req.body, SKILL_FIELDS));
  res.status(201).json({
    status: httpStatus.SUCCESS,
    data: { skill: newSkill },
  });
});

const updateSkill = asyncWrapper(async (req, res, next) => {
  const updatedSkill = await Skill.findByIdAndUpdate(
    req.params.id,
    { $set: pick(req.body, SKILL_FIELDS) },
    { new: true, runValidators: true, projection: { __v: false } }
  ).lean();

  if (!updatedSkill) return next(skillNotFound());

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: { skill: updatedSkill },
  });
});

const deleteSkill = asyncWrapper(async (req, res, next) => {
  const deletedSkill = await Skill.findByIdAndDelete(req.params.id);
  if (!deletedSkill) return next(skillNotFound());

  await Promise.all(
    deletedSkill.skillsList.map((item) => removeUpload(item.image))
  );

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: null,
  });
});

// CRUD operations for skillsList items

const addSkillItem = asyncWrapper(async (req, res, next) => {
  const newItem = pick(req.body, ITEM_FIELDS);

  // atomic push, no read-modify-write race
  const skill = await Skill.findByIdAndUpdate(
    req.params.id,
    { $push: { skillsList: newItem } },
    { new: true, runValidators: true }
  );

  if (!skill) return next(skillNotFound());

  return res.status(201).json({
    status: httpStatus.SUCCESS,
    data: { skillItem: skill.skillsList[skill.skillsList.length - 1] },
  });
});

const getSkillItem = asyncWrapper(async (req, res, next) => {
  const skill = await Skill.findById(req.params.id);
  if (!skill) return next(skillNotFound());

  const skillItem = skill.skillsList.id(req.params.itemId);
  if (!skillItem) return next(itemNotFound());

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: { skillItem },
  });
});

const updateSkillItem = asyncWrapper(async (req, res, next) => {
  const updates = pick(req.body, ITEM_FIELDS);

  const skill = await Skill.findById(req.params.id);
  const skillItem = skill?.skillsList.id(req.params.itemId);

  if (!skillItem) return next(skill ? itemNotFound() : skillNotFound());

  const previousImage = skillItem.image;

  // partial update: only overwrite what was actually sent
  if (updates.name !== undefined) skillItem.name = updates.name;
  if (updates.image) skillItem.image = updates.image;

  await skill.save();

  if (updates.image && updates.image !== previousImage) {
    await removeUpload(previousImage);
  }

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: { skillItem },
  });
});

const deleteSkillItem = asyncWrapper(async (req, res, next) => {
  const skill = await Skill.findById(req.params.id);
  if (!skill) return next(skillNotFound());

  const skillItem = skill.skillsList.id(req.params.itemId);
  if (!skillItem) return next(itemNotFound());

  skillItem.deleteOne();
  await skill.save();
  await removeUpload(skillItem.image);

  return res.status(200).json({
    status: httpStatus.SUCCESS,
    data: { skillItem },
  });
});

module.exports = {
  getSkills,
  getSkill,
  addSkill,
  updateSkill,
  deleteSkill,
  addSkillItem,
  getSkillItem,
  updateSkillItem,
  deleteSkillItem,
};
