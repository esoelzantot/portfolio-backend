const mongoose = require("mongoose");

const homeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  imageSrc: {
    type: String,
    default: "uploads/home/main-img.png",
  },

  facebook: {
    type: String,
    required: true,
  },

  linkedin: {
    type: String,
    required: true,
  },

  github: {
    type: String,
    required: true,
  },
});

const Home = mongoose.model("Home", homeSchema);

module.exports = Home;
