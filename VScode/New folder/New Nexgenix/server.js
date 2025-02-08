// Load environment variables from .env file
require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const path = require('path');

class Server {
  constructor() {
    this.app = express();
    this.PORT = process.env.PORT || 5000;
    this.MONGODB_URI = process.env.MONGODB_URI;

    this.initializeMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  initializeMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  setupRoutes() {
    // Health check route
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime()
      });
    });

    // Root route
    this.app.get('/', (req, res) => {
      res.send('🚀 Server is running & MongoDB Connected!');
    });
  }

  setupErrorHandling() {
    // Global error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('❌ Error:', err.stack);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      this.gracefulShutdown();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      this.gracefulShutdown();
    });

    // Handle SIGTERM signal
    process.on('SIGTERM', () => {
      console.info('👋 SIGTERM received. Starting graceful shutdown...');
      this.gracefulShutdown();
    });
  }

  async connectDB() {
    if (!this.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }

    const connectWithRetry = async (retryCount = 0) => {
      try {
        const conn = await mongoose.connect(this.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          retryWrites: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      } catch (error) {
        console.error(`❌ MongoDB Connection Error (Attempt ${retryCount + 1}):`, error.message);
        
        if (retryCount < 5) {
          console.log(`Retrying connection in ${(retryCount + 1) * 5} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 5000));
          return connectWithRetry(retryCount + 1);
        } else {
          console.error('❌ Failed to connect to MongoDB after 5 attempts');
          process.exit(1);
        }
      }
    };

    await connectWithRetry();
  }

  async gracefulShutdown() {
    console.log('🛑 Initiating graceful shutdown...');
    
    try {
      // Close MongoDB connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
      }

      // Close Express server
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(() => {
            console.log('✅ Express server closed');
            resolve();
          });
        });
      }

      console.log('👋 Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  async start() {
    try {
      await this.connectDB();
      
      this.server = this.app.listen(this.PORT, () => {
        console.log(`
🚀 Server is running!
📍 Port: ${this.PORT}
🔍 Health check: http://localhost:${this.PORT}/health
⚙️ Environment: ${process.env.NODE_ENV || 'development'}
        `);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Create and start server
const server = new Server();
server.start();