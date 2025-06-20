import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51RXM5K01bTVtzeZIoG6BUPQTMXhPmpDZuZpFAcoADk1WVYtG6JSu6QGoOop1ruSIMp6v5YtPHGEvxRuqy3syjsHi00qIR1De5U');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

function CheckoutForm({ order, onPaymentSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [creatingIntent, setCreatingIntent] = useState(false);

  // Determine the final price for the order
  const finalPrice = order?.negotiated_price ? parseFloat(order.negotiated_price) : parseFloat(order.price);
  const totalAmount = finalPrice * order.quantity;

  const createPaymentIntent = useCallback(async () => {
    if (!order) return;
    
    setCreatingIntent(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: totalAmount,
          currency: 'inr'
        }),
      });

      const data = await response.json();
      if (data.success) {
        setClientSecret(data.clientSecret);
      } else {
        setError(data.message || 'Failed to create payment intent');
      }
    } catch (err) {
      setError('Network error while creating payment intent');
    } finally {
      setCreatingIntent(false);
    }
  }, [order, totalAmount]);

  useEffect(() => {
    if (order && !clientSecret) {
      createPaymentIntent();
    }
  }, [order, clientSecret, createPaymentIntent]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready');
      setLoading(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Confirm payment with backend
      try {
        const response = await fetch('http://localhost:5000/api/payments/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            orderId: order.id
          }),
        });

        const data = await response.json();
        if (data.success) {
          onPaymentSuccess();
        } else {
          setError(data.message || 'Failed to confirm payment');
        }
      } catch (err) {
        setError('Network error while confirming payment');
      }
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Complete Payment</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body">
            <div className="mb-4">
              <h6>Order Summary</h6>
              <div className="card p-3 bg-light">
                <div className="d-flex justify-content-between">
                  <span>Product:</span>
                  <span>{order.product_name}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Quantity:</span>
                  <span>{order.quantity}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Price per unit:</span>
                  <span>₹{finalPrice.toFixed(2)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {creatingIntent && (
              <div className="text-center mb-3">
                <div className="spinner-border text-success" />
                <p className="mt-2">Preparing payment form...</p>
              </div>
            )}

            {!creatingIntent && (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Card Details</label>
                  <div className="border rounded p-3">
                    <CardElement options={CARD_ELEMENT_OPTIONS} />
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger mb-3">
                    {error}
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn eco-btn flex-grow-1"
                    disabled={!stripe || loading || !clientSecret}
                  >
                    {loading ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)}`}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ show, onClose, order, onPaymentSuccess }) {
  if (!show || !order) return null;

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        order={order}
        onPaymentSuccess={onPaymentSuccess}
        onClose={onClose}
      />
    </Elements>
  );
}

export default PaymentModal; 