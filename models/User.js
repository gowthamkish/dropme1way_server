const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String},
  mobile: { type: Number, unique: true },
  pickUpLocation: { type: String },
  dropOffLocation: { type: String },
  pickUpDateAndTime: { type: Date },
  returnDateAndTime: { type: Date },
  carType: { type: String },
  tripType: { type: String, default: "oneway" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
