const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
// const authRoutes = require("./routes/auth");
// const productRoutes = require("./routes/products");
// const adminRoutes = require("./routes/admin");
// const { protect, isAdmin } = require("./middlewares/authMiddleware");

const app = express();
app.use(cors());
app.use(express.json());

// app.get("/", (req, res) => {
//   res.status(200).json("Welcome, your app is working well");
// });


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

// app.use("/api/auth", authRoutes);
// app.use("/api/products", protect, productRoutes);
// app.use("/api/admin", protect, isAdmin, adminRoutes);
app.use("/api/bookings", require("./routes/user"));


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectToDatabase();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
