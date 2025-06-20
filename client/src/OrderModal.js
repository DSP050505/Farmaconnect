import React, { useState } from 'react';

function OrderModal({ show, onClose, product, onOrderPlaced }) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.REACT_APP_API_URL;

  if (!show || !product) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/orders/place`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: product.id, quantity })
      });
      if (res.ok) {
        setSuccess('Order placed successfully!');
        onOrderPlaced(product);
      } else {
        setError('Failed to place order.');
      }
    } catch (e) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      {/* Render your modal content here */}
    </div>
  );
}

export default OrderModal;