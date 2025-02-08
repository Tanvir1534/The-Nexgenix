require('dotenv').config(); // Load environment variables
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
    // Connect to MongoDB only once here
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1); // Exit process with failure
  }
};

// Define a schema and model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Create a user
const createUser = async () => {
  try {
    const user = new User({ name: 'John Doe', email: 'john.doe@example.com' });
    await user.save();
    console.log('✅ User created:', user);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  }
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('🚀 Server is running & MongoDB Connected!');
});

// Start the server
const startServer = async () => {
  await connectDB(); // Connect to MongoDB
  await createUser(); // Create a test user

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
};

startServer();

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ success: false, error: err.message });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});
