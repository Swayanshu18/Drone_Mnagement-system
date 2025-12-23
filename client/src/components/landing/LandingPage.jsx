/**
 * Landing Page Component
 * 
 * Glassmorphic drone showcase landing page with stunning background.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import droneBg from '../../assets/drone-bg.jpg';
import logo from '../../assets/logo.png';
import './LandingPage.css';

const features = [
  {
    icon: '🗺️',
    title: 'Smart Mapping',
    description: 'AI-powered terrain analysis and route optimization'
  },
  {
    icon: '📡',
    title: 'Real-Time Tracking',
    description: 'Live telemetry and mission monitoring'
  },
  {
    icon: '📊',
    title: 'Analytics',
    description: 'Comprehensive survey reports and insights'
  },
  {
    icon: '🔒',
    title: 'Secure',
    description: 'Enterprise-grade security and access control'
  }
];

const stats = [
  { value: '500+', label: 'Missions Completed' },
  { value: '50K', label: 'Hectares Surveyed' },
  { value: '99.9%', label: 'Accuracy Rate' },
  { value: '24/7', label: 'Support' }
];

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Background Image */}
      <div 
        className="landing-bg" 
        style={{ backgroundImage: `url(${droneBg})` }}
      />
      <div className="landing-overlay" />

      {/* Navigation */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-brand">
          <img src={logo} alt="DroneSurvey" className="brand-logo" />
          <span className="brand-text">DroneSurvey</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#stats">Stats</a>
          <a href="#about">About</a>
        </div>
        <button className="nav-cta glass-btn" onClick={() => navigate('/login')}>
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glass-card">
          <span className="hero-badge">Professional Drone Survey Platform</span>
          <h1 className="hero-title">
            Elevate Your
            <span className="title-gradient"> Survey Operations</span>
          </h1>
          <p className="hero-description">
            Transform aerial data collection with our intelligent drone management system. 
            Plan missions, monitor flights in real-time, and generate comprehensive survey reports.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary-glass" onClick={() => navigate('/login')}>
              Start Free Trial
              <span className="btn-arrow">→</span>
            </button>
            <button className="btn-secondary-glass" onClick={() => navigate('/login')}>
              Watch Demo
            </button>
          </div>
          
          {/* Mini Stats */}
          <div className="hero-mini-stats">
            {stats.slice(0, 3).map((stat, index) => (
              <div key={index} className="mini-stat">
                <span className="mini-stat-value">{stat.value}</span>
                <span className="mini-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-subtitle">Everything you need for professional drone surveys</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card glass-card">
              <span className="feature-icon">{feature.icon}</span>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section">
        <div className="stats-glass-card">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-glass-card">
          <h2 className="cta-title">Ready to Transform Your Surveys?</h2>
          <p className="cta-description">
            Join hundreds of professionals using DroneSurvey for their aerial mapping needs.
          </p>
          <button className="btn-primary-glass large" onClick={() => navigate('/login')}>
            Get Started Now
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer glass-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src={logo} alt="DroneSurvey" className="brand-logo" />
            <span>DroneSurvey</span>
          </div>
          <p className="footer-text">© 2024 DroneSurvey Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
