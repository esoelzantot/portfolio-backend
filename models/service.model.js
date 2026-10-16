const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  modalTitle: {
    type: String,
    required: true,
  },

  modalDescription: {
    type: String,
    required: true,
  },

  provisions: {
    type: [String],
    required: true,
  },
});

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
