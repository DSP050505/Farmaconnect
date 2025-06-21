import React, { useState } from 'react';

function OrderModal({ show, onClose, product, onOrderPlaced }) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  if (!show || !product) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/place`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: product.id, quantity })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Order placed successfully!');
        setTimeout(() => {
          onOrderPlaced(product);
        }, 1500);
      } else {
        setError(data.message || 'Failed to place order.');
      }
    } catch (e) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Place Order</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-3">
              <div className="col-md-4">
                {product.image && (
                  <img 
                    src={`${API_URL}/api/products/images/${product.image}`} 
                    alt={product.name} 
                    className="img-fluid rounded"
                    style={{ maxHeight: 120 }}
                  />
                )}
              </div>
              <div className="col-md-8">
                <h6>{product.name}</h6>
                <p className="text-muted mb-1">{product.crop_type}</p>
                <p className="mb-1">Price: ₹{product.price} / {product.unit}</p>
                <p className="mb-0">Available: {product.quantity} {product.unit}</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="quantity" className="form-label">Quantity ({product.unit})</label>
                <input
                  type="number"
                  className="form-control"
                  id="quantity"
                  min="1"
                  max={product.quantity}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  required
                />
                <div className="form-text">Total: ₹{(product.price * quantity).toFixed(2)}</div>
              </div>
              
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn eco-btn" disabled={loading}>
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderModal;