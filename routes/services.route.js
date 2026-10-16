const express = require("express");

const servicesController = require("../controllers/services.controller");
const requireAdmin = require("../middlewares/requireAdmin");

const router = express.Router();

router
  .route("/")
  .get(servicesController.getServices)
  .post(requireAdmin, servicesController.addService);

router
  .route("/:id")
  .get(servicesController.getService)
  .patch(requireAdmin, servicesController.updateService)
  .delete(requireAdmin, servicesController.deleteService);

module.exports = router;
