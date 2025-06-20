import React from 'react';

function BrowseProductsButton({ onClick, active }) {
  return (
    <button
      className={`btn eco-btn w-100${active ? ' active-btn' : ''}`}
      style={{ fontWeight: 600 }}
      onClick={onClick}
      disabled={active}
    >
      Browse Products
    </button>
  );
}

export default BrowseProductsButton; 