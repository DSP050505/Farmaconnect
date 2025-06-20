const express = require('express');
const multer = require('multer');
const pool = require('../db');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Middleware to check if user is a farmer (simple JWT check)
function authenticateFarmer(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Invalid token' });
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'farmer') return res.status(403).json({ success: false, message: 'Forbidden' });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// Add a product (with image upload)
router.post('/add', authenticateFarmer, upload.single('image'), async (req, res) => {
  const { name, description, crop_type, price, quantity, unit, location } = req.body;
  if (!name || !crop_type || !price || !quantity || !unit) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  try {
    const imagePath = req.file ? req.file.filename : null;
    const result = await pool.query(
      'INSERT INTO products (farmer_id, name, description, crop_type, price, quantity, unit, location, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [req.user.id, name, description, crop_type, price, quantity, unit, location, imagePath]
    );
    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List products for the logged-in farmer
router.get('/my', authenticateFarmer, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE farmer_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public: Get all products with optional filtering
router.get('/', async (req, res) => {
  const { crop_type, pin_code, radius } = req.query;
  let query = 'SELECT p.*, u.pin_code as farmer_pin FROM products p JOIN users u ON p.farmer_id = u.id WHERE 1=1';
  const params = [];
  if (crop_type) {
    params.push(crop_type);
    query += ` AND p.crop_type = $${params.length}`;
  }
  // Simple location logic: filter by exact PIN code match (placeholder for real geo logic)
  if (pin_code) {
    params.push(pin_code);
    query += ` AND u.pin_code = $${params.length}`;
  }
  query += ' ORDER BY p.created_at DESC';
  try {
    const result = await pool.query(query, params);
    res.json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve uploaded images
router.use('/images', express.static(path.join(__dirname, '../uploads')));

module.exports = router; 