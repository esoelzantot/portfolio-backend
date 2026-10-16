const express = require("express");

const educationsController = require("../controllers/educations.controller");
const requireAdmin = require("../middlewares/requireAdmin");

const router = express.Router();

router
  .route("/")
  .get(educationsController.getEducations)
  .post(requireAdmin, educationsController.addEducation);

router
  .route("/:id")
  .get(educationsController.getEducation)
  .patch(requireAdmin, educationsController.updateEducation)
  .delete(requireAdmin, educationsController.deleteEducation);

module.exports = router;
