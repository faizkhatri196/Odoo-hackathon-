const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

const startServer = async () => {
  // Connect to Database first
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 StockSense Backend running on http://localhost:${PORT}`);
    console.log(`🔗 REST API available at http://localhost:${PORT}/api`);
  });

  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
