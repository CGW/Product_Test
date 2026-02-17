import app from './app.js';
import env from './config/env.js';
import { initializeDatabase } from './config/database.js';

// Initialize database
initializeDatabase();

// Start server
app.listen(env.PORT, () => {
  console.log(`Oracle App Server running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
