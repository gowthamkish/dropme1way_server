const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
// app.use(cors());

// ✅ CORS Setup — allow your frontend domain
app.use(cors({
  origin: ['https://dropme1way.com', 'http://localhost:5173'],  // 👈 allow only your custom domain
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));


app.use(express.json());


// Global Mongoose connection handler for Vercel/serverless
const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

connectToDatabase();

app.use("/api/bookings", require("./routes/user"));


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectToDatabase();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
