const express = require("express");
const User = require("../models/User");
const router = express.Router();
const { Resend } = require("resend");
const resendKey = new Resend(process.env.RESEND_API_KEY);

// Add Twilio
const twilio = require("twilio");
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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
      tripType,
    } = req.body;

    // Validate required fields
    if (!name || !mobile || !pickUpLocation || !dropOffLocation) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: name, mobile, pickUpLocation, dropOffLocation",
      });
    }

    // Create and save user
    const user = new User({
      name,
      mobile,
      pickUpLocation,
      dropOffLocation,
      pickUpDateAndTime,
      returnDateAndTime,
      carType,
      tripType,
    });

    await user.save();
    console.log("Booking saved successfully:", user._id);

    // Send notifications (email and WhatsApp)
    await sendNotifications(user);

    res.json({
      success: true,
      user,
      message: "Booking created and notifications sent!",
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to send notifications
async function sendNotifications(user) {
  const notifications = [];

  // Send email notification
  if (process.env.RESEND_API_KEY) {
    notifications.push(sendEmailNotification(user));
  }

  // Send WhatsApp notification
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    notifications.push(sendWhatsAppNotification(user));
  }

  // Execute all notifications concurrently
  const results = await Promise.allSettled(notifications);

  // Log results
  results.forEach((result, index) => {
    const service = index === 0 ? "Email" : "WhatsApp";
    if (result.status === "fulfilled") {
      console.log(`${service} notification sent successfully`);
    } else {
      console.error(`${service} notification failed:`, result.reason);
    }
  });
}

// Email notification function
async function sendEmailNotification(user) {
  const { data, error } = await resendKey.emails.send({
    from: "DropMe1Way <booking@dropme1way.com>",
    to: [process.env.GMAIL_USER || "gowthamkishore6055@gmail.com"],
    subject: "New Booking Received",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🚗 New Booking Received</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
          <p><strong>Customer:</strong> ${user.name}</p>
          <p><strong>Mobile:</strong> ${user.mobile}</p>
          <p><strong>Pick Up Location:</strong> ${user.pickUpLocation}</p>
          <p><strong>Drop Off Location:</strong> ${user.dropOffLocation}</p>
          <p><strong>Pick Up Date & Time:</strong> ${
            user.pickUpDateAndTime
              ? new Date(user.pickUpDateAndTime).toLocaleString()
              : "Not specified"
          }</p>
          <p><strong>Return Date & Time:</strong> ${
            user.returnDateAndTime
              ? new Date(user.returnDateAndTime).toLocaleString()
              : "Not specified"
          }</p>
          <p><strong>Car Type:</strong> ${user.carType}</p>
          <p><strong>Trip Type:</strong> ${user.tripType}</p>
          <p><strong>Booking Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Email failed: ${error.message}`);
  }

  return data;
}

// WhatsApp notification function
async function sendWhatsAppNotification(user) {
  const whatsappMessage = `🚗 *New Booking Alert!*

👤 *Customer:* ${user.name}
📱 *Mobile:* ${user.mobile}
📍 *Pickup:* ${user.pickUpLocation}
🎯 *Drop-off:* ${user.dropOffLocation}
🗓️ *Pickup Time:* ${
    user.pickUpDateAndTime
      ? new Date(user.pickUpDateAndTime).toLocaleString()
      : "Not specified"
  }
🔄 *Return Time:* ${
    user.returnDateAndTime
      ? new Date(user.returnDateAndTime).toLocaleString()
      : "Not specified"
  }
🚙 *Car Type:* ${user.carType}
🛣️ *Trip Type:* ${user.tripType}
⏰ *Booked At:* ${new Date().toLocaleString()}`;

  const message = await client.messages.create({
    body: whatsappMessage,
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:+91${process.env.ADMIN_WHATSAPP_NUMBER}`,
  });

  return message;
}

module.exports = router;
