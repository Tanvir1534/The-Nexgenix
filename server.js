require('dotenv').config(); // Load environment variables

// Check if dotenv is loading the .env file correctly
console.log('MONGO_URI:', process.env.MONGODB_URI); // This should print the MongoDB URI

const mongoose = require('mongoose');
const express = require('express');
const path = require('path');

const app = express();

// MongoDB connection function
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;  // Get the URI from the .env file

    if (!uri) {
      throw new Error("MongoDB URI is not defined in the .env file.");
    }

    // Connect to MongoDB
    await mongoose.connect(uri); 
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1); // Exit process with failure
  }
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Root route - Send the index.html file when visiting the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test route to check if the API is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Start the server
const startServer = async () => {
  await connectDB(); // Connect to MongoDB

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ success: false, error: err.message });
});

// Graceful shutdown with promises for mongoose connection close
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0); // Exit gracefully
  } catch (err) {
    console.error('❌ Error closing MongoDB connection:', err);
    process.exit(1); // Exit with error
  }
});
