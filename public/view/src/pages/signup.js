import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';
import logoSlogan from '../assets/brand-logo.png';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    country: '',
    password: '',
    confirmPassword: '',
    email: '',
    username: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      const response = await api.post('/signup', formData);
      login(response.data.token);
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-sidebar">
        <div className="auth-sidebar-bg"></div>
        <div className="auth-sidebar-content">
          <img src={logoSlogan} alt="Brotherhood - Together to the heaven" className="auth-hero-logo" />
          <h1 className="auth-sidebar-title">Join Brotherhood</h1>
          <p className="auth-sidebar-text">Create an account to start tracking your transactions and managing your financial goals together.</p>
        </div>
      </div>
      <div className="auth-content">
        <div className="auth-box glass-panel" style={{ padding: '2rem', maxWidth: '500px' }}>
          <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
            <img src={logoSlogan} alt="Brotherhood" className="auth-card-logo" />
            <h2 className="auth-title">Create Account</h2>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="auth-form-grid">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">First Name</label>
                <input type="text" name="firstName" className="form-input" value={formData.firstName} onChange={handleChange} required />
                {errors.firstName && <div className="auth-error">{errors.firstName}</div>}
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Last Name</label>
                <input type="text" name="lastName" className="form-input" value={formData.lastName} onChange={handleChange} required />
                {errors.lastName && <div className="auth-error">{errors.lastName}</div>}
              </div>
            </div>

            <div className="auth-form-grid">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Username</label>
                <input type="text" name="username" className="form-input" value={formData.username} onChange={handleChange} required />
                {errors.username && <div className="auth-error">{errors.username}</div>}
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Phone Number</label>
                <input type="text" name="phoneNumber" className="form-input" value={formData.phoneNumber} onChange={handleChange} required />
                {errors.phoneNumber && <div className="auth-error">{errors.phoneNumber}</div>}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
              {errors.email && <div className="auth-error">{errors.email}</div>}
            </div>

            <div className="auth-form-grid">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Password</label>
                <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} required />
                {errors.password && <div className="auth-error">{errors.password}</div>}
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Confirm Password</label>
                <input type="password" name="confirmPassword" className="form-input" value={formData.confirmPassword} onChange={handleChange} required />
                {errors.confirmPassword && <div className="auth-error">{errors.confirmPassword}</div>}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Country</label>
              <input type="text" name="country" className="form-input" value={formData.country} onChange={handleChange} required />
              {errors.country && <div className="auth-error">{errors.country}</div>}
            </div>
            
            {errors.general && <div className="auth-error" style={{ marginBottom: '1rem' }}>{errors.general}</div>}
            
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
