import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // Suppress strictQuery warning in Mongoose 7+
    mongoose.set('strictQuery', false); 
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};