const express = require("express");

const worksController = require("../controllers/works.controller");
const requireAdmin = require("../middlewares/requireAdmin");

const router = express.Router();

router
  .route("/")
  .get(worksController.getWorks)
  .post(requireAdmin, worksController.addWork);

router
  .route("/:id")
  .get(worksController.getWork)
  .patch(requireAdmin, worksController.updateWork)
  .delete(requireAdmin, worksController.deleteWork);

module.exports = router;
