import React from 'react';
import './LandingPage.css';
import coverImg from './coverpageimage.jpg';

function AuthBox({ children }) {
  return (
    <div className="landing-bg" style={{ backgroundImage: `url(${coverImg})` }}>
      <div className="landing-overlay d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="authbox-mainbox shadow-lg d-flex flex-column justify-content-center align-items-center">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthBox; 