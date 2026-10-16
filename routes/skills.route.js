const express = require("express");

const createMulter = require("../middlewares/createMulter");
const upload = createMulter("skills");
const requireAdmin = require("../middlewares/requireAdmin");
const skillsController = require("../controllers/skills.controller");

const router = express.Router();

router
  .route("/")
  .get(skillsController.getSkills)
  .post(requireAdmin, skillsController.addSkill);

router
  .route("/:id")
  .get(skillsController.getSkill)
  .patch(requireAdmin, skillsController.updateSkill)
  .delete(requireAdmin, skillsController.deleteSkill);

router
  .route("/:id/skillsList")
  .post(requireAdmin, upload.single("image"), skillsController.addSkillItem);

router
  .route("/:id/skillsList/:itemId")
  .get(skillsController.getSkillItem)
  .patch(requireAdmin, upload.single("image"), skillsController.updateSkillItem)
  .delete(requireAdmin, skillsController.deleteSkillItem);

module.exports = router;
