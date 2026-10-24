import app from './app.js';
import { seedDatabase } from './config/seedRunner.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
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
