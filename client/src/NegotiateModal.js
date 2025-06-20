import React, { useState } from 'react';

function NegotiateModal({ show, onClose, order, onNegotiated, role }) {
  const [price, setPrice] = useState(order?.negotiated_price || order?.price || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!show || !order) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const endpoint = role === 'buyer'
        ? `http://localhost:5000/api/orders/buyer-negotiate/${order.id}`
        : `http://localhost:5000/api/orders/negotiate/${order.id}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ negotiated_price: price })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Negotiation failed');
      } else {
        setSuccess('Negotiated price sent!');
        if (onNegotiated) onNegotiated();
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{role === 'buyer' ? 'Counter Offer' : 'Negotiate Price'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-2">Product: <b>{order.product_name}</b></div>
              {role === 'farmer' && <div className="mb-2">Buyer: {order.buyer_name} ({order.buyer_email})</div>}
              <div className="mb-3">
                <label className="form-label">Negotiated Price (₹)</label>
                <input type="number" className="form-control" min={1} value={price} onChange={e => setPrice(e.target.value)} required />
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
              <button type="submit" className="btn btn-warning" disabled={loading}>{loading ? 'Sending...' : (role === 'buyer' ? 'Send Counter Offer' : 'Send Negotiation')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NegotiateModal; 