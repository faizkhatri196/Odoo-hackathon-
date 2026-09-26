const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

// Connect to Database
connectDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 StockSense Backend running on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});
