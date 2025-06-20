const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'farmconnect',
  password: 'rishikha555*',
  port: 5432,
});

// Get user profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await pool.query('SELECT id, name, email, role, pin_code FROM users WHERE id = $1', [req.user.id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, profile: user.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name, pin_code } = req.body;
    if (!name || !pin_code) {
      return res.status(400).json({ success: false, message: 'Name and PIN code are required.' });
    }
    
    const updateQuery = 'UPDATE users SET name = $1, pin_code = $2 WHERE id = $3 RETURNING id, name, email, role, pin_code';
    const result = await pool.query(updateQuery, [name, pin_code, req.user.id]);
    
    res.json({ success: true, message: 'Profile updated successfully.', profile: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 