const mongoose = require('mongoose');

let fallbackMode = false;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interview-prep';
    console.log('Connecting to MongoDB at:', mongoUri);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });

    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    fallbackMode = false;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Failed: ${error.message}`);
    console.warn('⚠️ Falling back to local JSON file database for storage.');
    fallbackMode = true;
  }
};

const isFallback = () => fallbackMode;

module.exports = { connectDB, isFallback };
