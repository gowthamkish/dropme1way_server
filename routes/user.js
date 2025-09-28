const express = require("express");
const User = require("../models/User");
const router = express.Router();
const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const resendKey = new Resend(process.env.RESEND_API_KEY);

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

    const { data, error } = await resendKey.emails.send({
      from: "DropMe1Way <booking@dropme1way.com>",
      to: [process.env.GMAIL_USER],
      subject: "New Booking Received",
      html: `
        <h2>New Booking Received</h2>
        <p><strong>Name:</strong> ${user.name}</p>
        <p><strong>Mobile:</strong> ${user.mobile}</p>
        <p><strong>Pick Up Location:</strong> ${user.pickUpLocation}</p>
        <p><strong>Drop Off Location:</strong> ${user.dropOffLocation}</p>
        <p><strong>Pick Up Date & Time:</strong> ${
          user.pickUpDateAndTime
            ? new Date(user.pickUpDateAndTime).toLocaleString()
            : ""
        }</p>
        <p><strong>Return Date & Time:</strong> ${
          user.returnDateAndTime
            ? new Date(user.returnDateAndTime).toLocaleString()
            : ""
        }</p>
        <p><strong>Car Type:</strong> ${user.carType}</p>
        <p><strong>Trip Type:</strong> ${user.tripType}</p>
        <p><strong>Booking Time:</strong> ${
          user.createdAt ? new Date(user.createdAt).toLocaleString() : ""
        }</p>
      `,
    });

    if (error) {
      console.error("Error sending email via Resend:", error);
      return res.status(400).json({ error });
    }

    res.status(200).json({ data });

    // Create transporter
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.GMAIL_USER, // Your Gmail address
    //     pass: process.env.GMAIL_PASS, // Your Gmail App Password
    //   },
    // });

    // // Email options
    // const mailOptions = {
    //   from: process.env.GMAIL_USER,
    //   to: process.env.GMAIL_USER,
    //   subject: "New Booking Received",
    //   html: `
    //     <h2>New Booking Received</h2>
    //     <p><strong>Name:</strong> ${user.name}</p>
    //     <p><strong>Mobile:</strong> ${user.mobile}</p>
    //     <p><strong>Pick Up Location:</strong> ${user.pickUpLocation}</p>
    //     <p><strong>Drop Off Location:</strong> ${user.dropOffLocation}</p>
    //     <p><strong>Pick Up Date & Time:</strong> ${
    //       user.pickUpDateAndTime
    //         ? new Date(user.pickUpDateAndTime).toLocaleString()
    //         : ""
    //     }</p>
    //     <p><strong>Return Date & Time:</strong> ${
    //       user.returnDateAndTime
    //         ? new Date(user.returnDateAndTime).toLocaleString()
    //         : ""
    //     }</p>
    //     <p><strong>Car Type:</strong> ${user.carType}</p>
    //     <p><strong>Trip Type:</strong> ${user.tripType}</p>
    //     <p><strong>Booking Time:</strong> ${
    //       user.createdAt ? new Date(user.createdAt).toLocaleString() : ""
    //     }</p>
    //   `,
    // };

    // // Send email
    // transporter.sendMail(mailOptions, (err, info) => {
    //   if (err) {
    //     console.error("Error sending email:", err);
    //   } else {
    //     console.log("Email sent:", info.response);
    //   }
    // });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
