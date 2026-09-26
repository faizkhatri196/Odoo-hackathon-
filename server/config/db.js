const mongoose = require('mongoose');
const dns = require('dns');
const { MONGO_URI, MONGODB_URI } = require('./env');

// Set reliable public DNS servers for MongoDB Atlas SRV resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Safe ignore if permission denied
}

const uri = MONGODB_URI || MONGO_URI;

// Limit Mongoose buffering timeout so requests don't hang for 10000ms if disconnected
mongoose.set('bufferTimeoutMS', 5000);

const connectDB = async (retries = 3) => {
  if (!uri) {
    console.error('CRITICAL CONFIGURATION ERROR: MONGODB_URI is not configured.');
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        autoIndex: true,
      });
      console.log(`✅ MongoDB Connected to host: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.warn(`⚠️ Database Connection Attempt ${attempt}/${retries} Failed: ${error.message}`);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  console.error(
    '\n❌ MongoDB Atlas Connection Failed after retries.\n' +
    '👉 If you are experiencing login or operation timeouts, please verify:\n' +
    '   1. MongoDB Atlas Network Access: Ensure IP whitelist contains 0.0.0.0/0 (Allow access from anywhere).\n' +
    '   2. Internet Connection: Check that port 27017 or DNS SRV lookups are not blocked by your router/hotspot.\n' +
    '   3. Environment Variables: Verify MONGODB_URI is present in root .env or server/.env.\n'
  );
  return null;
};

const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;
