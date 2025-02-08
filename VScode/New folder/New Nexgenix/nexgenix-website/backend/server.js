const dotenv = require("dotenv");
const mongoose = require("mongoose");
const express = require("express");

// Load environment variables from .env
dotenv.config();

const connectDB = require("./config/database");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());

// API Routes
app.use("/api/contact", require("./routes/contactRoutes"));

// Server Listening
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
