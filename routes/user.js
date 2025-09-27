const express = require("express");
const User = require("../models/User");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      name,
      mobile,
      pickUpLocation,
      dropOffLocation,
      pickUpDateAndTime,
      returnDateAndTime,
      carType,
    } = req.body;
    const user = new User({
      name,
      mobile,
      pickUpLocation,
      dropOffLocation,
      pickUpDateAndTime,
      returnDateAndTime,
      carType,
      tripType: "oneway",
    });
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
