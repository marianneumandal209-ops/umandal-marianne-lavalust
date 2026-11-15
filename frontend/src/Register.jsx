import React, { useState } from 'react';
import api from './api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/register', { full_name: fullName, email, password });
      setSuccess('Account created. Redirecting to your dashboard...');
      navigate('/taxpayer', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Hindi makakonekta sa server. Pakisubukan muli.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F0FDF4', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(22, 163, 74, 0.1)', width: '100%', maxWidth: '420px', border: '1px solid #DCFCE7' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#166534', margin: '0 0 8px 0', fontSize: '26px', fontWeight: '700' }}>MindoroPayLink</h2>
          <p style={{ color: '#4B5563', fontSize: '14px', margin: 0 }}>Taxpayer Account Registration</p>
        </div>
        
        {success && <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center', fontWeight: '500' }}>{success}</div>}
        {error && <div role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Full Name</label>
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="Juan Dela Cruz"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="taxpayer@gmail.com"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="********"
              minLength={8}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}
              required
            />
          </div>
          
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#86EFAC' : '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          <span style={{ color: '#4B5563' }}>Already have an account? </span>
          <Link to="/login" style={{ color: '#166534', textDecoration: 'none', fontWeight: '600' }}>Sign In here</Link>
        </div>
      </div>
    </div>
  );
}