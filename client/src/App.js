import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import FarmerDashboard from './FarmerDashboard';
import BuyerDashboard from './BuyerDashboard';
import LandingPage from './LandingPage';
import ProfilePage from './ProfilePage';
import ContactPage from './ContactPage';
import 'bootstrap/dist/css/bootstrap.min.css';
//trigerring redeploy 
function App() {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  const handleLogin = (user) => {
    setUser(user);
    window.location.href = user.role === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Placeholder dashboards */}
        <Route path="/farmer/dashboard" element={user && user.role === 'farmer' ? <FarmerDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/buyer/dashboard" element={user && user.role === 'buyer' ? <BuyerDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <ProfilePage user={user} /> : <Navigate to="/login" />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/" element={<LandingPage />} />
        {/* Default route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
