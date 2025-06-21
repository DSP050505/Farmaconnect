import React, { useEffect, useState } from 'react';
import NegotiateModal from './NegotiateModal';
import ChatModal from './ChatModal';
import ChatButton from './ChatButton';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function FarmerOrderList({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [negotiateOrder, setNegotiateOrder] = useState(null);
  const [chatOrder, setChatOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/farmer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to fetch orders');
      } else {
        setOrders(data.orders);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAccept = async (orderId) => {
    setActionMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/farmer-accept/${orderId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        setActionMsg(data.message || 'Failed to accept negotiation');
      } else {
        setActionMsg(data.message);
        fetchOrders();
      }
    } catch (err) {
      setActionMsg('Network error');
    }
  };

  const handleNegotiate = (order) => {
    setNegotiateOrder(order);
    setActionMsg('');
  };

  const handleNegotiated = () => {
    setNegotiateOrder(null);
    setActionMsg('Negotiated price sent!');
    fetchOrders();
  };

  const handleCancel = async (orderId) => {
    setActionMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/farmer-cancel/${orderId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        setActionMsg(data.message || 'Failed to cancel order');
      } else {
        setActionMsg('Order cancelled.');
        fetchOrders();
      }
    } catch (err) {
      setActionMsg('Network error');
    }
  };

  const handleMarkAsRead = (orderId) => {
    setOrders(prevOrders =>
      prevOrders.map(o => 
        o.id === orderId ? { ...o, unread_messages: 0 } : o
      )
    );
  };

  return (
    <div>
      <h5 className="mb-3">Orders for My Products</h5>
      {actionMsg && <div className="alert alert-info">{actionMsg}</div>}
      {loading && <div className="text-center my-3"><div className="spinner-border" /></div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row">
        {orders.map(order => (
          <div className="col-md-6 mb-3" key={order.id}>
            <div className="card h-100 shadow-sm">
              {order.product_image && (
                <img src={`${API_URL}/api/products/images/${order.product_image}`} alt={order.product_name} className="card-img-top" style={{ maxHeight: 180, objectFit: 'cover' }} />
              )}
              <div className="card-body">
                <h5 className="card-title">{order.product_name}</h5>
                <div>Buyer: {order.buyer_name} ({order.buyer_email})</div>
                <div>Quantity: {order.quantity}</div>
                <div>Price: ₹{order.price}</div>
                {order.negotiated_price && <div>Negotiated Price: <b>₹{order.negotiated_price}</b></div>}
                <div>Status: <b>{order.status}</b></div>
                <div className="text-muted mt-2" style={{ fontSize: '0.9em' }}>Ordered on: {new Date(order.created_at).toLocaleString()}</div>
                <div className="mt-3 d-flex gap-2 flex-wrap">
                  {(['negotiation', 'buyer_accepted'].includes(order.status)) && <button className="btn btn-success btn-sm" onClick={() => handleAccept(order.id)}>Accept</button>}
                  {['negotiation', 'pending', 'buyer_accepted', 'farmer_accepted'].includes(order.status) && <button className="btn btn-warning btn-sm" onClick={() => handleNegotiate(order)}>Negotiate</button>}
                  {['negotiation', 'pending', 'buyer_accepted', 'farmer_accepted'].includes(order.status) && <button className="btn btn-outline-danger btn-sm" onClick={() => handleCancel(order.id)}>Cancel</button>}
                  {order.status === 'paid' && (
                    <div className="paid-indicator">
                      <span className="icon">✓</span> Paid
                    </div>
                  )}
                  <ChatButton 
                    onClick={() => setChatOrder(order)} 
                    unreadCount={order.unread_messages} 
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        {(!loading && orders.length === 0) && <div className="text-muted">No orders found.</div>}
      </div>
      <NegotiateModal show={!!negotiateOrder} onClose={() => setNegotiateOrder(null)} order={negotiateOrder} onNegotiated={handleNegotiated} role="farmer" />
      <ChatModal 
        show={!!chatOrder} 
        onClose={() => setChatOrder(null)} 
        order={chatOrder} 
        currentUser={user}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
}

export default FarmerOrderList; 