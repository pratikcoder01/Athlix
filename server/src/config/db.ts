import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || (process.env.NODE_ENV === 'production' ? '' : 'mongodb://127.0.0.1:27017/athlix');
  if (!uri) throw new Error('MONGO_URI is required in production');
  // Fail promptly rather than buffering requests against an unavailable database.
  mongoose.set('bufferCommands', false);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000, maxPoolSize: 20 });
};

export default connectDB;
