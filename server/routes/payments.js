const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');

const router = express.Router();

// PostgreSQL connection
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { orderId, amount, currency = 'inr' } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ success: false, message: 'Order ID and amount are required' });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        orderId: orderId
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment intent' });
  }
});

// Helper to create a notification
async function createNotification(user_id, type, message) {
  await pool.query(
    'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)',
    [user_id, type, message]
  );
}

// Confirm payment and update order status
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId || !orderId) {
      return res.status(400).json({ success: false, message: 'Payment intent ID and order ID are required' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order status in database
      const updateQuery = `
        UPDATE orders 
        SET status = 'paid', 
            payment_intent_id = $1, 
            updated_at = NOW() 
        WHERE id = $2
      `;
      
      await pool.query(updateQuery, [paymentIntentId, orderId]);

      // 1. Get buyer_id and product_id from the order
      const getBuyerQuery = 'SELECT buyer_id, product_id FROM orders WHERE id = $1';
      const getBuyerResult = await pool.query(getBuyerQuery, [orderId]);

      if (getBuyerResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const { buyer_id, product_id } = getBuyerResult.rows[0];

      // 2. Get farmer_id from the product
      const getFarmerQuery = 'SELECT farmer_id FROM products WHERE id = $1';
      const getFarmerResult = await pool.query(getFarmerQuery, [product_id]);

      if (getFarmerResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const { farmer_id } = getFarmerResult.rows[0];

      // 3. Notify both buyer and farmer
      await createNotification(buyer_id, 'payment', 'Your payment was successful!');
      await createNotification(farmer_id, 'payment', 'You received a payment!');

      res.json({
        success: true,
        message: 'Payment confirmed and order updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed successfully'
      });
    }

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm payment' });
  }
});

// Get payment status
router.get('/payment-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const query = 'SELECT status, payment_intent_id FROM orders WHERE id = $1';
    const result = await pool.query(query, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = result.rows[0];
    res.json({
      success: true,
      status: order.status,
      paymentIntentId: order.payment_intent_id
    });

  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payment status' });
  }
});

module.exports = router; 