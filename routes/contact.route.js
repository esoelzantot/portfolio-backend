const express = require("express");
const router = express.Router();
const requireAdmin = require("../middlewares/requireAdmin");

const contactController = require("../controllers/contact.controller");

router.route("/").get(contactController.getContactData);

router.route("/:id").patch(requireAdmin, contactController.updateContactData);

module.exports = router;
