export default {
  mongoUri: process.env.MONGODB_URI,
  development: process.env.NODE_ENV !== 'production',
};
