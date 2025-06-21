import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BuyerProductBrowse from './BuyerProductBrowse';
import BuyerOrderList from './BuyerOrderList';
import BrowseProductsButton from './BrowseProductsButton';
import BuyerOrdersButton from './BuyerOrdersButton';
import LogoutButton from './LogoutButton';
import { ReactComponent as ProfileIcon } from './assets/profile-icon.svg';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function BuyerDashboard({ onLogout, user }) {
  const { t } = useTranslation();
  const [view, setView] = useState('browse'); // Default to browsing products
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleShowNotifications = () => {
    setShowNotifications(true);
    // Mark all as read
    notifications.filter(n => !n.is_read).forEach(async (n) => {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/notifications/${n.id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    });
    setTimeout(fetchNotifications, 500); // Refresh after marking read
  };

  const handleMobileLinkClick = (newView) => {
    setView(newView);
    setIsMobileMenuOpen(false);
  };
  
  const handleShowNotificationsMobile = () => {
    handleShowNotifications();
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="eco-dashboard-layout">
      {/* Mobile Header */}
      <header className="eco-mobile-header">
        <span className="eco-mobile-logo">FarmaConnect</span>
        <button className="eco-mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`eco-sidebar ${isMobileMenuOpen ? 'is-open' : ''}`}>
        <div className="eco-sidebar-profile">
          <Link to="/profile" className="profile-icon-link">
            <ProfileIcon />
          </Link>
          <span className="eco-sidebar-username">{user?.name || t('profile')}</span>
        </div>
        <nav className="eco-sidebar-nav">
          <button className={`eco-sidebar-btn${view === 'browse' ? ' active' : ''}`} onClick={() => handleMobileLinkClick('browse')}>
            {t('browse_products')}
          </button>
          <button className={`eco-sidebar-btn${view === 'orders' ? ' active' : ''}`} onClick={() => handleMobileLinkClick('orders')}>
            {t('my_orders')}
          </button>
          <button className={`eco-sidebar-btn${showNotifications ? ' active' : ''}`} onClick={handleShowNotificationsMobile} style={{position:'relative'}}>
            {t('notifications')}
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          <Link to="/profile" className="eco-sidebar-btn eco-sidebar-link" onClick={() => setIsMobileMenuOpen(false)}>
            {t('profile')}
          </Link>
          <button className="eco-sidebar-btn" onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}>{t('logout')}</button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="eco-dashboard-main">
        <div style={{height: 32, marginBottom: 24}} />
        {showNotifications ? (
          <div className="eco-dashboard-content">
            <h4>{t('notifications')}</h4>
            {notifications.length === 0 && <div className="text-muted">{t('no_notifications') || 'No notifications.'}</div>}
            <ul style={{listStyle:'none', padding:0}}>
              {notifications.map(n => (
                <li key={n.id} style={{background: n.is_read ? '#f1f8e9' : '#c8e6c9', borderRadius:8, marginBottom:8, padding:'10px 16px'}}>
                  <span style={{fontWeight: n.is_read ? 400 : 700}}>{n.message}</span>
                  <span style={{float:'right', fontSize:12, color:'#888'}}>{new Date(n.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <button className="btn btn-outline-secondary mt-3" onClick={() => setShowNotifications(false)}>{t('back_to_dashboard') || 'Back to Dashboard'}</button>
          </div>
        ) : view === 'browse' ? (
          <div className="eco-dashboard-content">
            <BuyerProductBrowse user={user} />
          </div>
        ) : view === 'orders' ? (
          <div className="eco-dashboard-content">
            <BuyerOrderList user={user} />
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '420px'}}>
            <img src={require('./greenlogo.png')} alt="FarmConnect Logo" style={{width: '400px', height: '400px', objectFit: 'contain', filter: 'drop-shadow(0 4px 24px rgba(34,139,34,0.18))'}} />
          </div>
        )}
      </main>
    </div>
  );
}

export default BuyerDashboard; 