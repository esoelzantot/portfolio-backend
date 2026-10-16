const express = require("express");
const router = express.Router();
const requireAdmin = require("../middlewares/requireAdmin");

const createMulter = require("../middlewares/createMulter");
const upload = createMulter("home");

const homeController = require("../controllers/home.controller");

router.route("/").get(homeController.getHomeData);

router
  .route("/:id")
  .patch(requireAdmin, upload.single("imageSrc"), homeController.updateHomeData);

module.exports = router;
