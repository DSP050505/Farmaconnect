import React from 'react';

function LogoutButton({ onClick }) {
  return (
    <button
      className="btn btn-outline-danger w-100"
      style={{ fontWeight: 600 }}
      onClick={onClick}
    >
      Logout
    </button>
  );
}

export default LogoutButton; 