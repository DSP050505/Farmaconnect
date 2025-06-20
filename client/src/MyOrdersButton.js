import React from 'react';

function MyOrdersButton({ onClick, active }) {
  return (
    <button
      className={`btn eco-btn w-100${active ? ' active-btn' : ''}`}
      style={{ fontWeight: 600 }}
      onClick={onClick}
      disabled={active}
    >
      My Orders
    </button>
  );
}

export default MyOrdersButton; 