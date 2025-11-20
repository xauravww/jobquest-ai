import connectDB from './db';
import mongoose from 'mongoose';

export default connectDB;
export const dbConnect = connectDB;
export const connectToDatabase = async () => {
  await connectDB();
  return { db: mongoose.connection.db! };
};
