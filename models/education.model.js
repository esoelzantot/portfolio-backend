const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema({
  mainTitle: {
    type: String,
    required: true,
  },

  subTitle: {
    type: String,
    required: true,
  },

  calendar: {
    type: String,
    required: true,
  },
});

const Education = mongoose.model("Education", educationSchema);

module.exports = Education;
