const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema({
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
    default: "uploads/about/about-img.png",
  },

  cvURL: {
    type: String,
    default:
      "https://drive.google.com/file/d/1h2LnOUaLTqJg9O-e_ACNvolvXnJyCwUY/view?usp=sharing",
  },

  experienceYears: {
    type: Number,
    required: true,
  },

  successProjects: {
    type: Number,
    required: true,
  },
});

const About = mongoose.model("About", aboutSchema);

module.exports = About;
