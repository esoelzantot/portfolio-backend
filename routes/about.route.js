const express = require("express");
const router = express.Router();
const requireAdmin = require("../middlewares/requireAdmin");

const createMulter = require("../middlewares/createMulter");
const upload = createMulter("about");

const aboutController = require("../controllers/about.controller");

router.route("/").get(aboutController.getAboutData);
router
  .route("/:id")
  .patch(requireAdmin, upload.single("imageSrc"), aboutController.updateAboutData);

module.exports = router;
