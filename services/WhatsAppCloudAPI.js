const axios = require("axios");

class WhatsAppCloudAPI {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.baseURL = `https://graph.facebook.com/v18.0/${this.phoneNumberId}`;

    // Add debug logging
    console.log("Access Token exists:", !!this.accessToken);
    console.log("Phone Number ID:", this.phoneNumberId);

    // Validate required env variables
    if (!this.accessToken || !this.phoneNumberId) {
      console.error("Missing WhatsApp Cloud API credentials");
      console.error("Access Token:", !!this.accessToken);
      console.error("Phone Number ID:", !!this.phoneNumberId);
      return;
    }
  }

  async sendMessage(to, message) {
    try {
      // Fix phone number format - ensure it has country code
      let formattedNumber = to.toString();

      formattedNumber = formattedNumber.replace(/[\s\+]/g, "");

      if (!formattedNumber.startsWith("91")) {
        formattedNumber = `91${formattedNumber}`;
      }

      console.log("Sending to formatted number:", formattedNumber);
      console.log('Using Access Token:', this.accessToken ? 'Token exists' : 'NO TOKEN');

      const headers = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      };

      console.log('Request Headers:', headers);

      const response = await axios.post(
        `${this.baseURL}/messages`,
        {
          messaging_product: "whatsapp",
          to: formattedNumber,
          text: { body: message },
        },
        { headers}
      );

      console.log("WhatsApp Cloud API Success:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "WhatsApp Cloud API Error:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async sendTemplateMessage(
    to,
    templateName,
    languageCode = "en_US",
    components = []
  ) {
    try {
      const formattedNumber = to.startsWith("91") ? to : `91${to}`;

      const response = await axios.post(
        `${this.baseURL}/messages`,
        {
          messaging_product: "whatsapp",
          to: formattedNumber,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
            components: components,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "WhatsApp Template Error:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

module.exports = WhatsAppCloudAPI;
