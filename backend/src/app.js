const express = require('express');
const cors = require('cors');

const authRoutes   = require('./routes/auth.routes');
const claimRoutes  = require('./routes/claim.routes');
const adminRoutes  = require('./routes/admin');          // P4 admin dashboard routes
const workerRoutes = require('./routes/worker.routes');  // P1 Worker PWA routes

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ✅ Root route (prevents "Cannot GET /")
app.get('/', (req, res) => {
  res.send('GigShield Backend Running 🚀');
});

// Routes
app.use('/auth',      authRoutes);
app.use('/claims',    claimRoutes);
app.use('/api/admin', adminRoutes);   // Admin dashboard endpoints (P4)
app.use('/api',       workerRoutes);  // Worker PWA endpoints (P1)

// ✅ 404 Handler (for wrong routes)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Global Error Handler (VERY IMPORTANT)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;