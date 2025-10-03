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

// Replace Twilio with WhatsApp Cloud API
const WhatsAppCloudAPI = require('../services/WhatsAppCloudAPI');
const whatsappAPI = new WhatsAppCloudAPI();

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
  // if (process.env.RESEND_API_KEY) {
  //   notifications.push(sendEmailNotification(user));
  // }

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
    to: [process.env.GMAIL_USER, "kgstechwayservices@gmail.com"],
    subject: "🚗 New Booking Alert - DropMe1Way",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Booking Alert</title>
        <style>
          body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
          .header p { color: #e8eaff; margin: 10px 0 0 0; font-size: 16px; }
          .content { padding: 40px 30px; }
          .booking-card { background: #f8fafc; border-radius: 12px; padding: 25px; margin: 20px 0; border-left: 5px solid #667eea; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .booking-header { text-align: center; margin-bottom: 25px; }
          .booking-id { background: #667eea; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .info-item { background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .info-label { font-weight: 600; color: #4a5568; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
          .info-value { color: #2d3748; font-size: 16px; font-weight: 500; }
          .location-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 20px; margin: 20px 0; color: white; }
          .location-item { display: flex; align-items: center; margin: 10px 0; }
          .location-icon { width: 20px; height: 20px; margin-right: 12px; }
          .priority-badge { background: #ef4444; color: white; padding: 5px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .action-buttons { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; padding: 12px 30px; margin: 0 10px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 14px; transition: all 0.3s ease; }
          .btn-primary { background: #667eea; color: white; }
          .btn-secondary { background: transparent; color: #667eea; border: 2px solid #667eea; }
          .footer { background: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
          .footer-logo { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 10px; }
          .divider { height: 2px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 20px 0; border-radius: 1px; }
          @media (max-width: 600px) {
            .info-grid { grid-template-columns: 1fr; }
            .content { padding: 20px 15px; }
            .btn { display: block; margin: 10px 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>🚗 DropMe1Way</h1>
            <p>New Booking Received</p>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="booking-card">
              <div class="booking-header">
                <span class="booking-id">Booking ID: ${
                  user._id ? user._id.toString().slice(-8).toUpperCase() : "NEW"
                }</span>
                <div style="margin: 15px 0;">
                  <span class="priority-badge">🔔 Immediate Attention Required</span>
                </div>
              </div>

              <div class="divider"></div>

              <!-- Customer Info -->
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">👤 Customer Name</div>
                  <div class="info-value">${user.name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">📱 Mobile Number</div>
                  <div class="info-value">${user.mobile}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">🚙 Car Type</div>
                  <div class="info-value">${
                    user.carType || "Not specified"
                  }</div>
                </div>
                <div class="info-item">
                  <div class="info-label">🛣️ Trip Type</div>
                  <div class="info-value">${user.tripType || "One Way"}</div>
                </div>
              </div>

              <!-- Journey Details -->
              <div class="location-section">
                <h3 style="margin: 0 0 15px 0; font-size: 18px;">🗺️ Journey Details</h3>
                <div class="location-item">
                  <span class="location-icon">🟢</span>
                  <div>
                    <strong>Pickup Location:</strong><br>
                    ${user.pickUpLocation}
                  </div>
                </div>
                <div class="location-item">
                  <span class="location-icon">🔴</span>
                  <div>
                    <strong>Drop-off Location:</strong><br>
                    ${user.dropOffLocation}
                  </div>
                </div>
              </div>

              <!-- Time Details -->
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">🗓️ Pickup Date & Time</div>
                  <div class="info-value">${
                    user.pickUpDateAndTime
                      ? new Date(user.pickUpDateAndTime).toLocaleString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "Not specified"
                  }</div>
                </div>
                <div class="info-item">
                  <div class="info-label">🔄 Return Date & Time</div>
                  <div class="info-value">${
                    user.returnDateAndTime
                      ? new Date(user.returnDateAndTime).toLocaleString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "Not specified"
                  }</div>
                </div>
              </div>

              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <div class="info-label">⏰ Booking Received At</div>
                <div class="info-value" style="color: #856404;">${new Date().toLocaleString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }
                )}</div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <a href="tel:${
                user.mobile
              }" class="btn btn-primary">📞 Call Customer</a>
              <a href="https://wa.me/91${
                user.mobile
              }" class="btn btn-secondary">💬 WhatsApp</a>
            </div>

            <!-- Quick Actions -->
            <div style="background: #e6fffa; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="color: #234e52; margin-top: 0;">⚡ Quick Actions</h3>
              <p style="color: #4a5568; margin: 10px 0;">Contact the customer immediately to confirm booking details and arrange the taxi service.</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-logo">DropMe1Way</div>
            <p>Professional Taxi Booking Service</p>
            <p style="font-size: 12px; margin-top: 15px;">
              This is an automated booking notification. Please respond promptly to ensure customer satisfaction.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  if (error) {
    throw new Error(`Email failed: ${error.message}`);
  }

  return data;
}

// WhatsApp Cloud API notification function
async function sendWhatsAppNotification(user) {
  const bookingId = user._id ? user._id.toString().slice(-8).toUpperCase() : 'NEW';
  const formatDate = (date) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const whatsappMessage = `🚗 *DROPME1WAY* - New Booking Alert! 🔔

🆔 *BOOKING ID:* ${bookingId}
⚠️ *IMMEDIATE ATTENTION*

👤 *CUSTOMER DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️ *Name:* ${user.name}
📱 *Mobile:* ${user.mobile}

🚗 *TRIP INFORMATION*
━━━━━━━━━━━━━━━━━━━━━━━━━
🛣️ *Type:* ${user.tripType || 'One Way'}
🚙 *Vehicle:* ${user.carType || 'Not specified'}

📍 *JOURNEY DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 *FROM:* ${user.pickUpLocation}
🔴 *TO:* ${user.dropOffLocation}

🗓️ *SCHEDULE*
━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 *Pickup:* ${formatDate(user.pickUpDateAndTime)}
${user.returnDateAndTime ? `🔄 *Return:* ${formatDate(user.returnDateAndTime)}` : ''}

⏰ *Booking Time:* ${new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}

🚨 *ACTION REQUIRED* - Contact customer ASAP!

📞 *Quick Actions:*
• Call: ${user.mobile}
• WhatsApp: wa.me/91${user.mobile}

🔥 *Priority: HIGH* 🔥
💼 *DropMe1Way Professional Service*`;

  // Send to multiple admin numbers
  const recipients = [process.env.ADMIN_WHATSAPP_NUMBER_1];
  
  if (process.env.ADMIN_WHATSAPP_NUMBER_2) {
    recipients.push(process.env.ADMIN_WHATSAPP_NUMBER_2);
  }

  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await whatsappAPI.sendMessage(recipient, whatsappMessage);
      console.log(`WhatsApp sent to ${recipient}:`, result.messages?.[0]?.id);
      results.push({ success: true, recipient, data: result });
    } catch (error) {
      console.error(`WhatsApp failed for ${recipient}:`, error.message);
      results.push({ success: false, recipient, error: error.message });
    }
  }

  return results;
}

module.exports = router;
