const mongoose = require('mongoose');
const config = require('./index');

/**
 * MongoDB Connection Module with Connection Pooling
 * Requirements: 23.1, 23.2, 23.3, 23.5, 23.6
 */

let isConnected = false;

/**
 * Connect to MongoDB with retry logic
 * @param {number} retries - Number of retry attempts
 * @param {number} delay - Delay between retries in milliseconds
 */
async function connectDatabase(retries = 1, delay = 2000) {
  if (isConnected) {
    console.log('Database already connected');
    return;
  }

  const options = {
    minPoolSize: config.database.options.minPoolSize,
    maxPoolSize: config.database.options.maxPoolSize,
    serverSelectionTimeoutMS: config.database.options.serverSelectionTimeoutMS || 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4
    maxIdleTimeMS: 600000, // 10 minutes idle connection timeout
    connectTimeoutMS: 10000 // 10 seconds connection timeout
  };

  let attempt = 0;

  while (attempt < retries) {
    try {
      attempt++;
      console.log(`Attempting to connect to MongoDB (attempt ${attempt}/${retries})...`);
      
      await mongoose.connect(config.database.uri, options);
      
      isConnected = true;
      console.log('MongoDB connected successfully');
      console.log(`Connection pool: min=${options.minPoolSize}, max=${options.maxPoolSize}`);
      console.log(`Idle timeout: ${options.maxIdleTimeMS / 1000 / 60} minutes`);
      
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, error.message);
      
      if (attempt >= retries) {
        console.error('All connection attempts failed. Exiting...');
        throw new Error(`Failed to connect to MongoDB after ${retries} attempts: ${error.message}`);
      }
      
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDatabase() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error.message);
    throw error;
  }
}

/**
 * Get connection status
 */
function getConnectionStatus() {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  isConnected = false;
});

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getConnectionStatus
};
