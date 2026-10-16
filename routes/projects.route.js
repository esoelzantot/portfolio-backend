const express = require("express");

const createMulter = require("../middlewares/createMulter");
const upload = createMulter("projects");
const requireAdmin = require("../middlewares/requireAdmin");

const projectsController = require("../controllers/projects.controller");
const router = express.Router();

router
  .route("/")
  .get(projectsController.getProjects)
  .post(requireAdmin, upload.single("imgSrc"), projectsController.addProject);

router
  .route("/:id")
  .get(projectsController.getProject)
  .patch(requireAdmin, upload.single("imgSrc"), projectsController.updateProject)
  .delete(requireAdmin, projectsController.deleteProject);

module.exports = router;
