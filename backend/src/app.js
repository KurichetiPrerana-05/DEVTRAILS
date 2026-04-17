const express = require('express');
const cors = require('cors');

const authRoutes   = require('./routes/auth.routes');
const claimRoutes  = require('./routes/claim.routes');
const adminRoutes  = require('./routes/admin');
const workerRoutes = require('./routes/worker.routes');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('GigShield Backend Running 🚀');
});

// Routes
app.use('/auth',      authRoutes);
app.use('/claims',    claimRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api',       workerRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;
