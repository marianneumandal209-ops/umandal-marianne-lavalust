import React, { useState } from 'react';
import api from './api';
import { Link, useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Pag-request ng OTP patungo sa /password-reset
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/password-reset', { email });
      setMessage(data.message || 'A 6-digit OTP has been sent to your email.');
      setStep(2); // Lipat sa OTP verification step
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Hindi makakonekta sa server. Pakisubukan muli.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Pag-verify ng OTP at pag-save ng bagong password patungo sa /reset-password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Hindi magkatugma ang mga password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Ang password ay dapat hindi bababa sa 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/reset-password', {
        email,
        otp,
        password: newPassword
      });
      setMessage(data.message || 'Matagumpay na nabago ang password! Redirecting...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Invalid o nag-expire na ang OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F0FDF4', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(22, 163, 74, 0.1)', width: '100%', maxWidth: '420px', border: '1px solid #DCFCE7' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#166534', margin: '0 0 8px 0', fontSize: '26px', fontWeight: '700' }}>MindoroPayLink</h2>
          <p style={{ color: '#4B5563', fontSize: '14px', margin: 0 }}>Password Recovery</p>
        </div>
        
        {message && <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center', fontWeight: '500' }}>{message}</div>}
        {error && <div role="alert" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Enter your Account Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="taxpayer@gmail.com"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}
                required
              />
            </div>
            
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#86EFAC' : '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'Sending OTP...' : 'Send OTP Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>6-Digit OTP Code</label>
              <input 
                type="text" 
                maxLength="6"
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                placeholder="Ilagay ang 6-digit OTP"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '16px', letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>New Password</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Minimum 8 characters"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Ulitin ang bagong password"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}
                required
              />
            </div>
            
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#86EFAC' : '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: loading ? 'wait' : 'pointer', marginBottom: '12px' }}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button 
              type="button" 
              onClick={() => { setStep(1); setMessage(''); setError(''); }}
              style={{ width: '100%', background: 'none', border: 'none', color: '#4B5563', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Iba ang gamiting email / Magpadala ulit ng OTP
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#166534', textDecoration: 'none', fontWeight: '600' }}>Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}