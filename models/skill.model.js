const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },

  experience: {
    type: Number,
    required: true,
  },

  skillsList: [
    {
      name: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        default: "uploads/skills/skill-img.jpg",
      },
    },
  ],
});

const Skill = mongoose.model("Skill", skillSchema);

module.exports = Skill;
