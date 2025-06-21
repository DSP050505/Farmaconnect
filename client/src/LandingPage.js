import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';
import coverImg from './coverpageimage.jpg';
import boxBgImg from './bgimage.avif';
import logoImg from './farma-logo.png';

function LandingPage() {
  const { t } = useTranslation();
  return (
    <div className="landing-bg" style={{ backgroundImage: `url(${coverImg})` }}>
      <div className="landing-overlay">
        <nav className="navbar navbar-expand-lg navbar-dark landing-navbar">
          <div className="container-fluid">
            <span className="navbar-brand landing-logo" style={{fontSize: "30px", paddingTop:"10px"}}>
              <img src={logoImg} alt="logo" className="me-2" style={{ width: 60, height: 60, borderRadius: '50%' }} />
              Farma Connect
            </span>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
              <ul className="navbar-nav mb-2 mb-lg-0">
                <li className="nav-item"><Link className="nav-link" to="/services">{t('our_services')}</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/products">{t('products')}</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/shop">{t('shop')}</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/contact">{t('contact')}</Link></li>
                <li className="nav-item"><Link className="btn btn-warning ms-lg-3 mt-2 mt-lg-0" to="/register">{t('get_started')}</Link></li>
              </ul>
            </div>
          </div>
        </nav>
        <div className="container landing-content d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <div className="landing-mainbox shadow-lg position-relative">
            <div className="mainbox-bg" style={{ backgroundImage: `url(${boxBgImg})` }} />
            <div className="mainbox-content position-relative w-100" style={{ zIndex: 2 }}>
              <div className="row align-items-center w-100">
                <div className="col-md-7 text-center text-md-start mb-4 mb-md-0">
                  <h1 className="landing-title landing-title-white agri-caption mb-0">
                    <span className="caption-roots">
                      <span className="caption-leaf" role="img" aria-label="leaf">🌱</span>   CONNECTING ROOTS
                    </span>
                    <span className="caption-connector"> WITH </span>
                    <span className="caption-market">MARKET</span>
                  </h1>
                </div>
                <div className="col-md-5 text-center">
                  <img src={logoImg} alt="logo" className="mainbox-logo no-bg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;