import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function ProfilePage({ user }) {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState({ name: '', email: '', pin_code: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  }, [language, i18n]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(t('fetch_profile_error'));
      }
      setLoading(false);
    };
    fetchProfile();
  }, [t]);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPassword({ ...password, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: profile.name, pin_code: profile.pin_code }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        // Also update user in localStorage if needed
        const updatedUser = { ...user, name: data.profile.name, pin_code: data.profile.pin_code };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(t('update_profile_error'));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/profile/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(password),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setPassword({ currentPassword: '', newPassword: '' }); // Clear fields
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(t('change_password_error'));
    }
  };

  const dashboardUrl = user.role === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard';

  if (loading) return <div className="farmer-dashboard-bg"><div className="text-center">{t('loading_profile')}</div></div>;

  return (
    <div className="farmer-dashboard-bg">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-7">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="farmer-dashboard-title" style={{marginBottom: 0}}>{t('profile')}</h2>
              <Link to={dashboardUrl} className="btn btn-outline-secondary">{t('back_to_dashboard')}</Link>
            </div>

            {/* Language Selector */}
            <div className="mb-4">
              <label className="form-label eco-label" htmlFor="language-select">{t('language')}</label>
              <select
                id="language-select"
                className="form-select"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{maxWidth: 220, display: 'inline-block', marginLeft: 12}}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            
            <div className="farmer-dashboard-card p-4 mb-4">
              <h5 className="mb-3">{t('update_profile_info')}</h5>
              <form onSubmit={handleProfileSubmit}>
                <div className="mb-3">
                  <label className="form-label eco-label">{t('email')} ({t('cannot_be_changed')})</label>
                  <input type="email" className="form-control" value={profile.email} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label eco-label">{t('name')}</label>
                  <input type="text" name="name" className="form-control eco-input" value={profile.name} onChange={handleProfileChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label eco-label">{t('pin_code')}</label>
                  <input type="text" name="pin_code" className="form-control eco-input" value={profile.pin_code} onChange={handleProfileChange} />
                </div>
                <button type="submit" className="btn eco-btn">{t('save_changes')}</button>
              </form>
            </div>

            <div className="farmer-dashboard-card p-4">
              <h5 className="mb-3">{t('change_password')}</h5>
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label eco-label">{t('current_password')}</label>
                  <input type="password" name="currentPassword" className="form-control eco-input" value={password.currentPassword} onChange={handlePasswordChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label eco-label">{t('new_password')}</label>
                  <input type="password" name="newPassword" className="form-control eco-input" value={password.newPassword} onChange={handlePasswordChange} />
                </div>
                <button type="submit" className="btn eco-btn">{t('change_password')}</button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage; 