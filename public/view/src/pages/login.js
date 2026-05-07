import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';
import logoSlogan from '../assets/brand-logo.png';
import { applyTheme, getStoredTheme } from '../utils/theme';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme());
  const { login } = useContext(AuthContext);

  const handleThemeChange = (nextTheme) => {
    setTheme(applyTheme(nextTheme));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      const response = await api.post('/login', formData);
      login(response.data.token);
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-container login-auth-container">
      <div className="auth-sidebar">
        <div className="auth-sidebar-bg"></div>
        <div className="auth-sidebar-content">
          <img src={logoSlogan} alt="Brotherhood - Together to the heaven" className="auth-hero-logo" />
          <h1 className="auth-sidebar-title">Welcome Back</h1>
          <p className="auth-sidebar-text">Track shared expenses, responsibilities, and monthly progress in one polished workspace.</p>
        </div>
      </div>
      <div className="auth-content login-auth-content">
        <div className="auth-box login-auth-box glass-panel">
          <div className="auth-header">
            <img src={logoSlogan} alt="Brotherhood" className="auth-card-logo" />
            <h2 className="auth-title">Sign In</h2>
            <p className="auth-subtitle">Access your dashboard</p>
          </div>

          <div className="theme-toggle" aria-label="Choose theme">
            <button
              type="button"
              className={theme === 'dark' ? 'active' : ''}
              onClick={() => handleThemeChange('dark')}
            >
              Dark
            </button>
            <button
              type="button"
              className={theme === 'light' ? 'active' : ''}
              onClick={() => handleThemeChange('light')}
            >
              Light
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <div className="auth-error">{errors.email}</div>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && <div className="auth-error">{errors.password}</div>}
            </div>
            
            {errors.general && <div className="auth-error" style={{ marginBottom: '1rem' }}>{errors.general}</div>}
            
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || !formData.email || !formData.password}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
