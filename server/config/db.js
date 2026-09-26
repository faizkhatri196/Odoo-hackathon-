const mongoose = require('mongoose');
const dns = require('dns');
const { MONGO_URI, MONGODB_URI } = require('./env');

// Set reliable public DNS servers for MongoDB Atlas SRV resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Safe ignore if permission denied
}

const uri = MONGODB_URI || MONGO_URI;

const connectDB = async () => {
  if (!uri) {
    console.error('CRITICAL CONFIGURATION ERROR: MONGODB_URI is not configured.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      autoIndex: true,
    });
    console.log(`✅ MongoDB Connected to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // Safe logging without credentials
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;
