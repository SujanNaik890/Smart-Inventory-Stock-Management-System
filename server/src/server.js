import app from './app.js';
import { seedDatabase } from './config/seedRunner.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be configured with at least 32 characters before starting the server.');
    }

    // Ensure DB exists and is initialized
    await seedDatabase(false);

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` StockSmart AI Backend Server running on port ${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

startServer();
