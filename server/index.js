require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const paymentRouter = require('./routes/payments');
const chatRouter = require('./routes/chat');
const profileRouter = require('./routes/profile');
const notificationsRouter = require('./routes/notifications');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());

// PostgreSQL connection config
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/chat', chatRouter);
app.use('/api/profile', profileRouter);
app.use('/api/notifications', notificationsRouter);

// Socket.IO connection logic
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Join a room based on orderId
  socket.on('join_room', (orderId) => {
    socket.join(orderId);
    console.log(`User with ID: ${socket.id} joined room: ${orderId}`);
  });

  // Listen for messages and broadcast them
  socket.on('send_message', (data) => {
    // Broadcast to the specific room
    socket.to(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('FarmConnect backend is running!');
});

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/__database_check', async (req, res) => {
    try {
        const tables = await pool.query(
            "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';"
        );
        const tableNames = tables.rows.map(row => row.tablename);
        res.status(200).json({ 
            success: true, 
            message: "Database connection successful. Tables found:", 
            tables: tableNames 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Database check failed.', 
            error: err.message 
        });
    }
});

server.listen(PORT, () => {
  console.log(`Server and Socket.IO running on port ${PORT}`);
}); 