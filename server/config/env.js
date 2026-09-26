const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Auto-detect .env from project root, server directory, or process cwd
const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
];

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
  }
}
dotenv.config();

const DEFAULT_ATLAS_URI = 'mongodb+srv://forb75845_db_user:faiz1712@cluster0.omeglpp.mongodb.net/stocksense?retryWrites=true&w=majority';

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_ATLAS_URI,
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_ATLAS_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'stocksense_odoo_hackathon_super_secret_jwt_key_2026',
  JWT_EXPIRE: process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

