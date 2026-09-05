const mongoose = require('mongoose');
const dns = require('dns');

// Fallback to public DNS servers (Google & Cloudflare) to prevent querySrv ECONNREFUSED on local networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}


let isConnected = false;
let memoryServerInstance = null;

const connectDB = async () => {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamfinder';

  try {
    // Attempt standard connection first
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500,
    });
    isConnected = true;
    console.log(`✅ MongoDB connected successfully to: ${mongoUri}`);

    // Drop any legacy or conflicting indexes from previous schemas
    try {
      await mongoose.connection.collection('users').dropIndex('rollNo_1').catch(() => {});
    } catch (e) {}
  } catch (err) {
    console.warn(`⚠️ Could not connect to primary MongoDB at ${mongoUri} (${err.message}).`);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Fatal: MongoDB connection failed in production mode. Aborting.');
      process.exit(1);
    }

    console.log('🔄 Initializing in-memory MongoDB server for zero-friction local development...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'teamfinder',
        }
      });
      const memUri = memoryServerInstance.getUri();
      await mongoose.connect(memUri);
      isConnected = true;
      console.log(`✅ Connected to in-memory MongoDB at: ${memUri}`);
      console.log('💡 Data will be kept in memory during this server session.');
    } catch (memErr) {
      console.error('❌ Failed to start both local and in-memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
