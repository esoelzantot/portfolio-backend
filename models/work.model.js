const mongoose = require("mongoose");

const workSchema = new mongoose.Schema({
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

const Work = mongoose.model("Work", workSchema);

module.exports = Work;
