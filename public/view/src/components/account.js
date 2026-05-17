import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Account.css';

const Account = () => {
  const { user, setUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    username: '',
    country: ''
  });
  
  const [image, setImage] = useState(null);
  const [profilePicture, setProfilePicture] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/user');
        const userData = response.data.userCredentials;
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          username: userData.username || '',
          country: userData.country || ''
        });
        setProfilePicture(userData.imageUrl || '');
      } catch (error) {
        console.error('Error fetching user', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const uploadImage = async (e) => {
    if (!image) return;
    setUploading(true);
    setErrorMsg('');
    
    let form_data = new FormData();
    form_data.append('image', image);

    try {
      await api.post('/user/image', form_data, {
        headers: { 'content-type': 'multipart/form-data' }
      });
      // reload to get new image
      window.location.reload();
    } catch (error) {
      console.error(error);
      setErrorMsg('Error uploading image. Make sure it is PNG or JPG.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const formRequest = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      country: formData.country
    };

    try {
      await api.put('/user', formRequest);
      // Update global user context
      setUser({ ...user, ...formRequest });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading Profile...</div>;
  }

  return (
    <div className="account-container">
      <div className="glass-panel profile-card">
        <img 
          src={profilePicture || `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=0e5968&color=f9fbf9`} 
          alt="Profile" 
          className="profile-avatar" 
        />
        <h3 className="profile-name">{formData.firstName} {formData.lastName}</h3>
        <p className="profile-role">@{formData.username}</p>
        
        <div className="upload-btn-wrapper">
          <button className="btn-primary" style={{ width: '100%', marginBottom: '0.5rem' }}>
            Choose Photo
          </button>
          <input type="file" onChange={handleImageChange} accept="image/png, image/jpeg" />
        </div>
        
        {image && (
          <div style={{ marginTop: '0.5rem', width: '100%' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
              Selected: {image.name}
            </p>
            <button 
              className="btn-primary" 
              style={{ width: '100%', background: 'var(--success)' }} 
              onClick={uploadImage}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Now'}
            </button>
          </div>
        )}

        {errorMsg && <div className="auth-error">{errorMsg}</div>}
      </div>

      <div className="glass-panel settings-card">
        <h2 className="settings-title">Personal Information</h2>
        
        <form className="settings-form" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input type="text" name="firstName" className="form-input" value={formData.firstName} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input type="text" name="lastName" className="form-input" value={formData.lastName} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email (Read Only)</label>
            <input type="email" name="email" className="form-input input-disabled" value={formData.email} disabled />
          </div>
          
          <div className="form-group">
            <label className="form-label">Phone Number (Read Only)</label>
            <input type="text" name="phoneNumber" className="form-input input-disabled" value={formData.phoneNumber} disabled />
          </div>
          
          <div className="form-group full-width">
            <label className="form-label">Country</label>
            <input type="text" name="country" className="form-input" value={formData.country} onChange={handleChange} required />
          </div>

          <div className="full-width form-actions">
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Account;
