const mongoose = require("mongoose");
const { staticImage } = require("../utils/uploads");

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
        default: () => staticImage("skills/skill-img.jpg"),
      },
    },
  ],
});

const Skill = mongoose.model("Skill", skillSchema);

module.exports = Skill;
