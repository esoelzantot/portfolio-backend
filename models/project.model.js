const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  modalTitle: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  githubURL: {
    type: String,
    trim: true,
  },

  imgSrc: {
    type: String,
    default: "uploads/projects/project-img.jpg",
  },

  features: [
    {
      type: String,
      trim: true,
    },
  ],
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
