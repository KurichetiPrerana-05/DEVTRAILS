require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

// ── Create HTTP server + Socket.io ────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes (e.g., emit on new claim)
app.set('io', io);

io.on('connection', (socket) => {
  console.log('[Socket.io] Admin client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('[Socket.io] Admin client disconnected:', socket.id);
  });
});

// ── Real-time claim broadcaster ───────────────────────────────
// Polls DB every 5s and emits new claims to all connected admin clients.
// Replace the setInterval with pg LISTEN/NOTIFY for true push in production.
let lastBroadcastAt = new Date(0);

setInterval(async () => {
  try {
    const result = await pool.query(
      `SELECT * FROM claims WHERE created_at > $1 ORDER BY created_at DESC LIMIT 20`,
      [lastBroadcastAt]
    );
    if (result.rows.length > 0) {
      lastBroadcastAt = new Date();
      io.emit('new_claims', result.rows);
    }
  } catch (err) {
    console.error('[Socket.io] Broadcast error:', err.message);
  }
}, 5000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`GigShield server running on port ${PORT}`);
  console.log(`Socket.io real-time feed active`);
});
