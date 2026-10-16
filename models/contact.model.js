const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  location: {
    type: String,
    required: true,
  },
});

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
