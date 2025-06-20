import React from 'react';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';

function ContactPage() {
  const { t } = useTranslation();
  return (
    <div className="contact-page-bg">
      <div className="contact-card">
        <div className="contact-accent" />
        <h2>{t('contact')}</h2>
        <div className="contact-row">
          <span className="contact-label">{t('name')}:</span>
          <span className="contact-value">Devi Sri Prasad</span>
        </div>
        <div className="contact-row">
          <span className="contact-icon" role="img" aria-label="email">📧</span>
          <a className="contact-link" href="mailto:doladevisriprasad050505@gmail.com">doladevisriprasad050505@gmail.com</a>
        </div>
        <div className="contact-row">
          <span className="contact-icon" role="img" aria-label="phone">📞</span>
          <a className="contact-link" href="tel:9515821645">9515821645</a>
        </div>
        <div className="contact-row">
          <span className="contact-icon" role="img" aria-label="linkedin">🔗</span>
          <a className="contact-link" href="https://www.linkedin.com/in/dola-devi-sri-prasad-301a50315/" target="_blank" rel="noopener noreferrer">dola-devi-sri-prasad</a>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;