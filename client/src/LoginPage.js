import React, { useState } from 'react';
import AuthBox from './AuthBox';
import './LandingPage.css';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Login failed');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (onLogin) onLogin(data.user);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <AuthBox>
      <h2 className="mb-4 text-center eco-title">Login</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="mb-3">
          <label className="form-label eco-label">Email</label>
          <input type="email" className="form-control eco-input" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label eco-label">Password</label>
          <input type="password" className="form-control eco-input" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <button type="submit" className="btn eco-btn w-100" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="text-center mt-3">
        <span>Don't have an account? </span>
        <a className="eco-link" href="/register">Register</a>
      </div>
    </AuthBox>
  );
}

export default LoginPage; 