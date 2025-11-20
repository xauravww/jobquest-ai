import mongoose from "mongoose";
import { logger } from "../lib/logger";
import config from "../lib/env";

// MongoDB connection options for production-ready setup
const getMongoOptions = () => {
  const { development } = config;

  const baseOptions = {
    // Connection pool settings
    maxPoolSize: 10, // Maximum number of connections in the connection pool
    minPoolSize: 2, // Minimum number of connections in the connection pool
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    serverSelectionTimeoutMS: 5000, // How long to try selecting a server
    socketTimeoutMS: 45000, // How long a send or receive on a socket can take before timing out

    // Retry settings
    retryWrites: true,
    retryReads: true,

    // Other settings
    autoIndex: !development, // Don't build indexes in production
    autoCreate: !development, // Don't auto-create collections in production
  };

  return baseOptions;
};

const connectDB = async (): Promise<void> => {
  const { mongoUri, development } = config;

  if (!mongoUri) {
    logger.error("MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    // Set mongoose options
    mongoose.set("strictQuery", true);

    // Connect with production-ready options
    await mongoose.connect(mongoUri, getMongoOptions());

    logger.info(
      `MongoDB connected successfully in ${
        development ? "development" : "production"
      } mode`
    );

    // Log connection details (without sensitive info)
    const connection = mongoose.connection;
    logger.info(`Database: ${connection.db?.databaseName}`);
    logger.info(`Host: ${connection.host}`);
    logger.info(`Port: ${connection.port}`);
  } catch (err) {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  logger.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  logger.error("Mongoose disconnected from MongoDB");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed through app termination");
    process.exit(0);
  } catch (err) {
    logger.error("Error during MongoDB disconnection:", err);
    process.exit(1);
  }
});

export default connectDB;
