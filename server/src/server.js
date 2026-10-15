import app from './app.js';
import connectDB from './config/db.js';
import env from './config/env.js';

// Connect to Database first
await connectDB();

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  ShopSphere Server running on port ${PORT}`);
  console.log(`  Environment : ${env.NODE_ENV}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`  Client URL  : ${env.CLIENT_URL}`);
  console.log(`=========================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION] Shutting down server gracefully...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Shutting down server...', err);
  process.exit(1);
});

// Graceful shutdown on SIGTERM / SIGINT
const handleShutdown = (signal) => {
  console.log(`\n[${signal}] Received. Closing HTTP server and database connections...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
