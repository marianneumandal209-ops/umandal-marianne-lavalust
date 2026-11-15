import React, { useState } from 'react';
import api from './api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 const navigate = useNavigate();

 const handleLogin = async (e) => {
 e.preventDefault();
 setError('');
 setLoading(true);

 try {
 const { data } = await api.post('/login', { email, password });
 if (data?.status !== 'success' || !data?.data?.role) {
 setError(data?.message || 'Hindi kumpleto ang login response ng server. Tingnan ang backend logs.');
 return;
 }
 const destinations = {
 admin: '/admin',
 cashier: '/cashier',
 taxpayer: '/taxpayer'
 };
 navigate(destinations[data.data.role] || '/login', { replace: true });
 } catch (requestError) {
 const status = requestError.response?.status;
 const serverMessage = requestError.response?.data?.message;
 if (serverMessage) {
 setError(serverMessage);
 } else if (status >= 500) {
 setError('Nagkaroon ng error ang backend habang nagla-login. Suriin ang PHP error log at tiyaking nailapat ang kinakailangang database migrations.');
 } else if (requestError.request) {
 setError('Hindi maabot ang backend API. Suriin kung tumatakbo ang Apache/PHP server at tama ang VITE_API_BASE_URL.');
 } else {
 setError('Hindi nakumpleto ang login request. Pakisubukan muli.');
 }
 } finally {
 setLoading(false);
 }
 };

 return (
 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F0FDF4', fontFamily: 'sans-serif' }}>
 <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(22, 163, 74, 0.1)', width: '100%', maxWidth: '400px', border: '1px solid #DCFCE7' }}>
 <div style={{ textAlign: 'center', marginBottom: '24px' }}>
 <h2 style={{ color: '#166534', margin: '0 0 8px 0', fontSize: '26px', fontWeight: '700' }}>MindoroPayLink</h2>
 <p style={{ color: '#4B5563', fontSize: '14px', margin: 0 }}>Provincial Revenue & Queuing System</p>
 </div>
 
 {error && <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
 
 <form onSubmit={handleLogin}>
 <div style={{ marginBottom: '16px' }}>
 <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Email Address</label>
 <input 
 type="email" 
 value={email} 
 onChange={(e) => setEmail(e.target.value)} 
 placeholder="e.g. admin@minpay.gov.ph"
 style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}
 required
 />
 </div>
 
 <div style={{ marginBottom: '16px' }}>
 <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Password</label>
 <input 
 type="password" 
 value={password} 
 onChange={(e) => setPassword(e.target.value)} 
 placeholder="********"
 style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }}
 required
 />
 </div>

  <div style={{ textAlign: 'right', marginBottom: '24px' }}>
 <Link to="/forgot-password" style={{ color: '#166534', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
 Forgot password?
 </Link>
 </div>
 
 <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#86EFAC' : '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: loading ? 'wait' : 'pointer', transition: 'background 0.2s' }}>
 {loading ? 'Signing In...' : 'Sign In'}
 </button>
 </form>

 <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
 <span style={{ color: '#4B5563' }}>Don't have an account? </span>
 <Link to="/register" style={{ color: '#166534', textDecoration: 'none', fontWeight: '600' }}>Register here</Link>
 </div>
 </div>
 </div>
 );
}