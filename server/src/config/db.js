import mongoose from 'mongoose';
import env from './env.js';

/**
 * Connect to MongoDB (Atlas or Local)
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true, // Automatically build indexes in development
    });

    const isAtlas = conn.connection.host.includes('mongodb.net');
    console.log(
      `[DATABASE] Connected successfully to ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}: ${conn.connection.host}/${conn.connection.name}`
    );

    return conn;
  } catch (error) {
    console.error(`[DATABASE ERROR] Failed to connect to MongoDB: ${error.message}`);
    console.error('Make sure your MONGODB_URI in server/.env is valid and your IP is whitelisted on MongoDB Atlas.');
    // In production we exit on startup failure, in dev we can exit with 1
    process.exit(1);
  }
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  console.warn('[DATABASE WARN] MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error(`[DATABASE ERROR] Runtime error: ${err.message}`);
});

export default connectDB;
