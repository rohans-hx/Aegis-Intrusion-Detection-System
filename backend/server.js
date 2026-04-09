const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }
});

io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`⚡ Client disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// Security Headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// Body Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/alerts',    require('./routes/alerts'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/rules',     require('./routes/rules'));
app.use('/api/logs',      require('./routes/logs'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/settings',  require('./routes/settings'));
app.use('/api/threat-intel', require('./routes/threatIntel'));
app.use('/api/devices', require('./routes/devices'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'AEGIS IDS Online', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'AEGIS IDS API v2.0', status: 'Active' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🛡️  AEGIS IDS Server running on port ${PORT} [${process.env.NODE_ENV}]\n`);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
