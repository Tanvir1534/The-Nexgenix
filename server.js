require('dotenv').config(); // Load environment variables
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const express = require('express');

// Check if index.html exists in the 'public' directory
const indexPath = path.join(__dirname, 'public', 'index.html');

fs.access(indexPath, fs.constants.F_OK, (err) => {
  if (err) {
    console.error('❌ index.html does not exist at', indexPath);
  } else {
    console.log('✅ index.html found at', indexPath);
  }
});

const app = express();

// MongoDB connection function
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;  // Get the URI from the .env file
    if (!uri) {
      throw new Error("MongoDB URI is not defined in the .env file.");
    }
    await mongoose.connect(uri); 
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Middleware
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Serve index.html if found
app.get('/', (req, res) => {
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send('❌ Error: index.html not found');
    }
  });
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
