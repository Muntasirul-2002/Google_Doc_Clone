const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  _id: String, // Assuming the document ID is a string
  data: String,
});

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
