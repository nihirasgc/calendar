const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const eventRoutes = require('./routes/events');
const authRoutes = require('./routes/auth'); // New auth routes

dotenv.config();
 
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // For URL-encoded data

// Database Connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit on failure
  }
}
connectDB();

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes); // Adding auth routes

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing server...');
  await mongoose.connection.close();
  server.close(() => {
    console.log('Server and database connections closed. Exiting.');
    process.exit(0);
  });
});
