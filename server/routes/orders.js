const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = 'farmconnect_secret'; // Same secret as in auth routes

// Middleware to check if user is a buyer
function authenticateBuyer(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Invalid token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'buyer') return res.status(403).json({ success: false, message: 'Forbidden' });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// Middleware to check if user is a farmer
function authenticateFarmer(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Invalid token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'farmer') return res.status(403).json({ success: false, message: 'Forbidden' });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// Helper to create a notification
async function createNotification(user_id, type, message) {
  await db.query(
    'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)',
    [user_id, type, message]
  );
}

// Place an order
router.post('/place', authenticateBuyer, async (req, res) => {
  const { product_id, quantity } = req.body;
  if (!product_id || !quantity) {
    return res.status(400).json({ success: false, message: 'Product and quantity required' });
  }
  try {
    // Get product price
    const productRes = await pool.query('SELECT price FROM products WHERE id = $1', [product_id]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const price = productRes.rows[0].price;
    const result = await pool.query(
      'INSERT INTO orders (buyer_id, product_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, product_id, quantity, price]
    );
    await createNotification(req.user.id, 'order', 'Your order has been placed!');
    await createNotification(productRes.rows[0].farmer_id, 'order', 'You received a new order!');
    res.status(201).json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get orders for the logged-in buyer
router.get('/my', authenticateBuyer, async (req, res) => {
  try {
    const buyerId = req.user.id;
    const query = `
      SELECT 
        o.*, 
        p.name as product_name, 
        p.image as product_image,
        (SELECT COUNT(*) FROM chats 
         WHERE order_id = o.id AND sender_id != $1 AND is_read = FALSE) as unread_messages
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.buyer_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query, [buyerId]);
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get orders for the logged-in farmer's products
router.get('/farmer', authenticateFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const query = `
      SELECT 
        o.*,
        p.name as product_name,
        p.image as product_image,
        u.name as buyer_name,
        u.email as buyer_email,
        (SELECT COUNT(*) FROM chats 
         WHERE order_id = o.id AND sender_id != $1 AND is_read = FALSE) as unread_messages
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      WHERE p.farmer_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query, [farmerId]);
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Buyer accepts negotiated price
router.patch('/buyer-accept/:id', authenticateBuyer, async (req, res) => {
  const orderId = req.params.id;
  try {
    // Ensure the order belongs to this buyer
    const check = await pool.query('SELECT * FROM orders WHERE id = $1 AND buyer_id = $2', [orderId, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }
    const order = check.rows[0];
    if (order.status === 'farmer_accepted') {
      await pool.query(`UPDATE orders SET status = 'accepted' WHERE id = $1`, [orderId]);
      await createNotification(req.user.id, 'order', 'Both parties accepted. Ready for payment.');
      return res.json({ success: true, message: 'Both parties accepted. Ready for payment.' });
    } else {
      await pool.query(`UPDATE orders SET status = 'buyer_accepted' WHERE id = $1`, [orderId]);
      await createNotification(req.user.id, 'order', 'You accepted the negotiation. Waiting for farmer.');
      return res.json({ success: true, message: 'You accepted the negotiation. Waiting for farmer.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Farmer accepts negotiated price
router.patch('/farmer-accept/:id', authenticateFarmer, async (req, res) => {
  const orderId = req.params.id;
  try {
    // Ensure the order belongs to a product owned by this farmer
    const check = await pool.query(
      `SELECT o.* FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = $1 AND p.farmer_id = $2`,
      [orderId, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }
    const order = check.rows[0];
    if (order.status === 'buyer_accepted') {
      await pool.query(`UPDATE orders SET status = 'accepted' WHERE id = $1`, [orderId]);
      await createNotification(req.user.id, 'order', 'Both parties accepted. Ready for payment.');
      return res.json({ success: true, message: 'Both parties accepted. Ready for payment.' });
    } else {
      await pool.query(`UPDATE orders SET status = 'farmer_accepted' WHERE id = $1`, [orderId]);
      await createNotification(req.user.id, 'order', 'You accepted the negotiation. Waiting for buyer.');
      return res.json({ success: true, message: 'You accepted the negotiation. Waiting for buyer.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Buyer counter-negotiates
router.patch('/buyer-negotiate/:id', authenticateBuyer, async (req, res) => {
  const orderId = req.params.id;
  const { negotiated_price } = req.body;
  if (!negotiated_price) {
    return res.status(400).json({ success: false, message: 'Negotiated price required' });
  }
  try {
    // Ensure the order belongs to this buyer
    const check = await pool.query('SELECT * FROM orders WHERE id = $1 AND buyer_id = $2', [orderId, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }
    await pool.query(`UPDATE orders SET negotiated_price = $1, status = 'negotiation' WHERE id = $2`, [negotiated_price, orderId]);
    await createNotification(req.user.id, 'order', `Counter-offer sent to farmer. Negotiated price: ${negotiated_price}`);
    res.json({ success: true, message: 'Counter-offer sent to farmer.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Farmer counter-negotiates
router.patch('/negotiate/:id', authenticateFarmer, async (req, res) => {
  const orderId = req.params.id;
  const { negotiated_price } = req.body;
  if (!negotiated_price) {
    return res.status(400).json({ success: false, message: 'Negotiated price required' });
  }
  try {
    // Ensure the order belongs to a product owned by this farmer
    const check = await pool.query(
      `SELECT o.* FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = $1 AND p.farmer_id = $2`,
      [orderId, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }
    await pool.query(`UPDATE orders SET negotiated_price = $1, status = 'negotiation' WHERE id = $2`, [negotiated_price, orderId]);
    await createNotification(req.user.id, 'order', `Negotiated price sent. Negotiated price: ${negotiated_price}`);
    res.json({ success: true, message: 'Negotiated price sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Buyer cancels order
router.patch('/buyer-cancel/:id', authenticateBuyer, async (req, res) => {
  const orderId = req.params.id;
  try {
    // Ensure the order belongs to this buyer
    const check = await pool.query('SELECT * FROM orders WHERE id = $1 AND buyer_id = $2', [orderId, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }
    await pool.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1`, [orderId]);
    await createNotification(req.user.id, 'order', 'Order cancelled.');
    res.json({ success: true, message: 'Order cancelled.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Farmer cancels order
router.patch('/farmer-cancel/:id', authenticateFarmer, async (req, res) => {
  const orderId = req.params.id;
  try {
    // Ensure the order belongs to a product owned by this farmer
    const check = await pool.query(
      `SELECT o.* FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = $1 AND p.farmer_id = $2`,
      [orderId, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }
    await pool.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1`, [orderId]);
    await createNotification(req.user.id, 'order', 'Order cancelled.');
    res.json({ success: true, message: 'Order cancelled.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Accept an order (farmer only, after buyer_accepted)
router.patch('/accept/:id', authenticateFarmer, async (req, res) => {
  const orderId = req.params.id;
  try {
    // Ensure the order belongs to a product owned by this farmer
    const check = await pool.query(
      `SELECT o.* FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = $1 AND p.farmer_id = $2`,
      [orderId, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }
    // Only allow if status is buyer_accepted
    if (check.rows[0].status !== 'buyer_accepted') {
      return res.status(400).json({ success: false, message: 'Buyer must accept the negotiated price first.' });
    }
    await pool.query(`UPDATE orders SET status = 'accepted' WHERE id = $1`, [orderId]);
    await createNotification(req.user.id, 'order', 'Order accepted. Ready for payment.');
    res.json({ success: true, message: 'Order accepted. Ready for payment.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 