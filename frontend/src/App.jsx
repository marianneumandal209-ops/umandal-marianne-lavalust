import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';

import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import Profile from './Profile';
import Payment from './Payment';
import QueuePass from './QueuePass';
import ReceiptVault from './ReceiptVault';
import TaxpayerDashboard from './TaxpayerDashboard';
import CashierDashboard from './CashierDashboard';
import AdminDashboard from './AdminDashboard';

function ProtectedRoute({ roles, children }) {
 const [user, setUser] = useState(null);
 const [checking, setChecking] = useState(true);
 const [error, setError] = useState('');

 useEffect(() => {
 api.get('/session')
 .then(({ data }) => setUser(data.data))
 .catch((requestError) => {
 if (requestError.response?.status !== 401) {
 setError('Hindi ma-verify ang session. Tiyaking tumatakbo ang backend at subukan muli.');
 }
 })
 .finally(() => setChecking(false));
 }, []);

 if (checking) return <div style={{ padding: '32px', textAlign: 'center' }}>Checking session...</div>;
 if (error) return <div role="alert" style={{ padding: '32px', textAlign: 'center', color: '#B91C1C' }}>{error}</div>;
 if (!user) return <Navigate to="/login" replace />;
 if (!roles.includes(user.role)) {
 const destination = {
 admin: '/admin',
 cashier: '/cashier',
 taxpayer: '/taxpayer'
 }[user.role] || '/login';
 return <Navigate to={destination} replace />;
 }
 return children;
}

function App() {
 return (
 <Router>
 <Routes>
 <Route path="/login" element={<Login />} />
 <Route path="/register" element={<Register />} />
 <Route path="/forgot-password" element={<ForgotPassword />} />
 <Route path="/profile" element={<ProtectedRoute roles={['taxpayer']}><Profile /></ProtectedRoute>} />
 <Route path="/payment" element={<ProtectedRoute roles={['taxpayer']}><Payment /></ProtectedRoute>} />
 <Route path="/queue-pass" element={<ProtectedRoute roles={['taxpayer']}><QueuePass /></ProtectedRoute>} />
 <Route path="/receipt-vault" element={<ProtectedRoute roles={['taxpayer']}><ReceiptVault /></ProtectedRoute>} />
 <Route path="/taxpayer" element={<ProtectedRoute roles={['taxpayer']}><TaxpayerDashboard /></ProtectedRoute>} />
 <Route path="/cashier" element={<ProtectedRoute roles={['cashier']}><CashierDashboard /></ProtectedRoute>} />
 <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
 <Route path="*" element={<Navigate to="/login" replace />} />
 </Routes>
 </Router>
 );
}

export default App;