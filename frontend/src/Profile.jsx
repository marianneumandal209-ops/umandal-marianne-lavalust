import React, { useEffect, useState } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/profile')
      .then(({ data }) => {
        setFullName(data.data.full_name || '');
        setEmail(data.data.email || '');
        setContact(data.data.contact_number || '');
        setAddress(data.data.address || '');
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Hindi makuha ang profile.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/profile', {
        full_name: fullName,
        contact_number: contact,
        address
      });
      setSuccess('Profile updated successfully!');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Hindi na-save ang profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', background: '#F0FDF4', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(22, 163, 74, 0.1)', width: '100%', maxWidth: '500px', border: '1px solid #DCFCE7' }}>
        <h2 style={{ color: '#166534', marginBottom: '8px', fontSize: '24px' }}>👤 User Profile Management</h2>
        <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '24px' }}>Update your personal information and account details.</p>
        
        {success && <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center', fontWeight: '500' }}>{success}</div>}
        {error && <div role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
        {loading ? <p>Loading profile...</p> : (
        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Full Name</label>
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', fontSize: '14px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              readOnly
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', fontSize: '14px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Contact Number</label>
            <input 
              type="text" 
              value={contact} 
              onChange={(e) => setContact(e.target.value)} 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Address</label>
            <textarea 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              rows="2"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', fontSize: '14px', fontFamily: 'sans-serif' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', background: saving ? '#86EFAC' : '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: saving ? 'wait' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => navigate(-1)} style={{ padding: '12px 20px', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>
              Back
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}