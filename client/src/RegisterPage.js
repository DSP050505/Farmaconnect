import React, { useState } from 'react';
import AuthBox from './AuthBox';
import './LandingPage.css';

function RegisterPage({ onRegister }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer', pin_code: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Registration failed');
      } else {
        setSuccess('Registration successful! You can now log in.');
        if (onRegister) onRegister();
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <AuthBox>
      <h2 className="mb-4 text-center eco-title">Register</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="mb-3">
          <label className="form-label eco-label">Name</label>
          <input type="text" className="form-control eco-input" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label eco-label">Email</label>
          <input type="email" className="form-control eco-input" name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label eco-label">Password</label>
          <input type="password" className="form-control eco-input" name="password" value={form.password} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label eco-label">Role</label>
          <select className="form-select eco-input" name="role" value={form.role} onChange={handleChange} required>
            <option value="farmer">Farmer</option>
            <option value="buyer">Buyer</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label eco-label">PIN Code</label>
          <input type="text" className="form-control eco-input" name="pin_code" value={form.pin_code} onChange={handleChange} required />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <button type="submit" className="btn eco-btn w-100" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div className="text-center mt-3">
        <span>Already have an account? </span>
        <a className="eco-link" href="/login">Login</a>
      </div>
    </AuthBox>
  );
}

export default RegisterPage; 