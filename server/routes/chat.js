const express = require('express');
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth'); // We'll create this middleware

const router = express.Router();
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'farmconnect',
  password: 'rishikha555*',
  port: 5432,
});

// Get all messages for a specific order
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    const messagesQuery = `
      SELECT c.id, c.message, c.sent_at, u.name as sender_name, u.id as sender_id
      FROM chats c
      JOIN users u ON c.sender_id = u.id
      WHERE c.order_id = $1
      ORDER BY c.sent_at ASC
    `;
    const result = await pool.query(messagesQuery, [orderId]);
    
    res.json({ success: true, messages: result.rows });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Save a new message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { orderId, message } = req.body;
    const senderId = req.user.id; // From authMiddleware

    if (!orderId || !message) {
      return res.status(400).json({ success: false, message: 'Order ID and message are required.' });
    }

    const insertQuery = `
      INSERT INTO chats (order_id, sender_id, message)
      VALUES ($1, $2, $3)
      RETURNING id, sent_at
    `;
    const result = await pool.query(insertQuery, [orderId, senderId, message]);

    // 1. Get order info (buyer_id, product_id)
    const orderQuery = `
      SELECT buyer_id, product_id
      FROM orders
      WHERE id = $1
    `;
    const orderResult = await pool.query(orderQuery, [orderId]);
    const orderInfo = orderResult.rows[0];

    // 2. Get farmer_id from product
    const productQuery = `
      SELECT farmer_id
      FROM products
      WHERE id = $1
    `;
    const productResult = await pool.query(productQuery, [orderInfo.product_id]);
    const farmerId = productResult.rows[0].farmer_id;

    // 3. Notify the other party (not senderId)
    await createNotification(farmerId, 'chat', `You received a new chat message!`);

    res.status(201).json({ success: true, message: 'Message saved.', data: result.rows[0] });
  } catch (error) {
    console.error('Failed to save message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark messages as read
router.put('/read/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id; // The user reading the messages

    // Update messages in the order that were not sent by the current user
    const updateQuery = `
      UPDATE chats
      SET is_read = TRUE
      WHERE order_id = $1 AND sender_id != $2 AND is_read = FALSE
    `;
    await pool.query(updateQuery, [orderId, userId]);
    
    res.json({ success: true, message: 'Messages marked as read.' });
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper to create a notification
async function createNotification(user_id, type, message) {
  await pool.query(
    'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)',
    [user_id, type, message]
  );
}

module.exports = router; 