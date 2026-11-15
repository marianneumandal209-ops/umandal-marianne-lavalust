import React, { useState, useEffect } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Active Tab State
  const [activeTab, setActiveTab] = useState('analytics');

  // Database Transactions & Analytics States
  const [transactions, setTransactions] = useState([]);
  const [ledgerIntegrity, setLedgerIntegrity] = useState(null);
  const [queueTickets, setQueueTickets] = useState([]); // Added for Queue Tickets
  const [users, setUsers] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [taxRatesLoading, setTaxRatesLoading] = useState(false);
  const [taxRatesError, setTaxRatesError] = useState('');
  const [taxRateSaveError, setTaxRateSaveError] = useState('');
  const [savingTaxRateId, setSavingTaxRateId] = useState(null);
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    onlineRevenue: 0,
    counterRevenue: 0,
    totalCount: 0
  });

  const exportTransactions = () => {
    const columns = ['id', 'e_or_number', 'taxpayer_id', 'tax_type', 'amount', 'payment_method', 'created_at'];
    const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [
      columns.join(','),
      ...transactions.map((transaction) => columns.map((column) => escapeCsv(transaction[column])).join(','))
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mindoropay-transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Fetch Live Data mula sa LavaLust Backend API (Aiven Cloud MySQL)
  useEffect(() => {
    // 1. Fetch Transactions
    api.get('/get_all_transactions')
      .then(response => {
        if (response.data.status === 'success') {
          const data = response.data.data;
          setTransactions(data);
          setLedgerIntegrity(response.data.ledger || null);

          // Compute Real-time Revenue Metrics
          let total = 0;
          let online = 0;
          let counter = 0;

          data.forEach(item => {
            const amt = parseFloat(item.amount || 0);
            total += amt;
            const method = (item.payment_method || '').toLowerCase();
            if (method.includes('gcash') || method.includes('online') || method.includes('auto-deduct') || method.includes('maya') || method.includes('bank')) {
              online += amt;
            } else {
              counter += amt;
            }
          });

          setMetrics({
            totalRevenue: total,
            onlineRevenue: online,
            counterRevenue: counter,
            totalCount: data.length
          });
        }
      })
      .catch(error => {
        console.error('Error fetching admin transaction records:', error);
      });

    // 2. Fetch Live Virtual Queue Tickets
    api.get('/get_queue_tickets')
      .then(response => {
        if (response.data.status === 'success') {
          setQueueTickets(response.data.data || []);
        }
      })
      .catch(error => {
        console.error('Error fetching queue tickets:', error);
      })
      .finally(() => {
        setLoading(false);
      });

    api.get('/users')
      .then(({ data }) => setUsers(data.data || []))
      .catch((error) => console.error('Error fetching user accounts:', error));
  }, []);

  const loadTaxRates = async () => {
    setTaxRatesLoading(true);
    setTaxRatesError('');
    try {
      const { data } = await api.get('/tax_rates');
      if (data.status !== 'success' || !Array.isArray(data.data)) {
        throw new Error('Unexpected tax-rate response from the backend.');
      }
      setTaxRates(data.data);
    } catch (error) {
      console.error('Error fetching tax-rate configuration:', error);
      setTaxRatesError(error.response?.data?.message || 'Tax-rate configuration could not be loaded.');
    } finally {
      setTaxRatesLoading(false);
    }
  };

  const saveTaxRate = async (rate) => {
    setSavingTaxRateId(rate.id);
    setTaxRateSaveError('');
    try {
      const { data } = await api.put('/tax_rates', {
        tax_type: rate.tax_type,
        rate_percent: rate.rate_percent,
        flat_fee: rate.flat_fee ?? 0
      });
      setTaxRates((current) => current.map((item) => item.id === rate.id ? data.data : item));
    } catch (error) {
      console.error('Error saving tax-rate configuration:', error);
      setTaxRateSaveError(error.response?.data?.message || 'Hindi na-save ang tax-rate configuration.');
    } finally {
      setSavingTaxRateId(null);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    setAuditError('');
    try {
      const { data } = await api.get('/audit_logs');
      setAuditLogs(data.data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditError(error.response?.data?.message || 'Hindi ma-load ang audit logs.');
    } finally {
      setAuditLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const query = analyticsSearch.trim().toLowerCase();
    if (!query) return true;
    return [
      transaction.e_or_number,
      transaction.taxpayer_name,
      `trx-${transaction.id}-omp`,
      transaction.taxpayer_id
    ].some((value) => String(value ?? '').toLowerCase().includes(query));
  });

  // Button Style Helper (Kapareho ng Cashier/Taxpayer Theme)
  const getButtonStyle = (tabKey) => {
    const isActive = activeTab === tabKey;
    return {
      padding: '8px 18px',
      background: isActive ? '#047857' : '#FFFFFF',
      color: isActive ? '#FFFFFF' : '#047857',
      border: '2px solid #047857',
      borderRadius: '6px',
      fontWeight: '700',
      cursor: 'pointer',
      fontSize: '13px',
      transition: 'all 0.2s ease-in-out',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    };
  };

  return (
    <div className="portal-shell" style={{ minHeight: '100vh', background: '#F0FDF4', fontFamily: 'sans-serif' }}>
      
      {/* Top Header Navigation Bar */}
      <header className="portal-header" style={{ 
        background: '#047857', 
        padding: '16px 32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderBottom: '2px solid #047857'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ color: '#FCD34D', fontSize: '10px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
            REPUBLIC OF THE PHILIPPINES • PROVINCE OF ORIENTAL MINDORO
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            {/* Pabilog na Logo */}
            <div style={{ 
              width: '42px', 
              height: '42px', 
              background: '#FCD34D', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '2px solid #FEF08A',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
            }}>
              <span style={{ fontSize: '20px' }}>🏛️</span>
            </div>
            <div>
              <h2 style={{ color: '#FFFFFF', margin: 0, fontSize: '19px', fontWeight: '800', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                MINDOROPAYLINK
              </h2>
              <span style={{ color: '#A7F3D0', fontSize: '11px', fontWeight: '700', letterSpacing: '0.3px' }}>
                Admin Dashboard
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/receipt-vault')}
            style={{ 
              padding: '8px 16px', 
              background: '#047857', 
              color: '#FFFFFF', 
              border: '1px solid #6EE7B7', 
              borderRadius: '6px', 
              fontWeight: '600', 
              cursor: 'pointer', 
              fontSize: '13px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            📂 e-OR Vault
          </button>
          <button 
            onClick={async () => {
              await api.post('/logout');
              navigate('/login', { replace: true });
            }}
            style={{ 
              padding: '8px 16px', 
              background: '#DC2626', 
              color: '#FFFFFF', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: '600', 
              cursor: 'pointer', 
              fontSize: '13px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Body Area */}
      <main className="portal-main" style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Navigation Tabs sa Pagitan ng Header Line at Content Box */}
        <div className="portal-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button style={getButtonStyle('analytics')} onClick={() => setActiveTab('analytics')}>
            Analytics Overview
          </button>

          <button style={getButtonStyle('queue')} onClick={() => setActiveTab('queue')}>
            Queue Management
          </button>
          
          <button style={getButtonStyle('users')} onClick={() => setActiveTab('users')}>
            User Accounts & RBAC
          </button>
          
          <button style={getButtonStyle('tax_config')} onClick={() => {
            setActiveTab('tax_config');
            loadTaxRates();
          }}>
            Tax Rates & Fee Config
          </button>
          
          <button style={getButtonStyle('blockchain')} onClick={() => setActiveTab('blockchain')}>
            Digital Ledger
          </button>
          
          <button style={getButtonStyle('reports')} onClick={() => {
            setActiveTab('reports');
            loadAuditLogs();
          }}>
            Reports & Audit Logs
          </button>
        </div>

        {/* Dynamic Content Card Box */}
        <div className="portal-content" style={{ 
          background: '#FFFFFF', 
          padding: '30px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
          border: '1px solid #D1FAE5' 
        }}>

          {/* TAB 1: ANALYTICS OVERVIEW */}
          {activeTab === 'analytics' && (
            <div>
              <h3 style={{ color: '#065F46', marginTop: 0, fontSize: '18px' }}>Provincial Revenue & Operational Analytics</h3>
              <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '20px' }}>
                Real-time collection efficiency, queuing traffic metrics, and live financial data pulled securely from your Aiven Cloud MySQL database[cite: 6].
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#F0FDF4', padding: '18px', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                  <span style={{ fontSize: '12px', color: '#065F46', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Provincial Revenue</span>
                  <h2 style={{ margin: '8px 0 0 0', color: '#065F46', fontSize: '24px' }}>
                    ₱{metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
                <div style={{ background: '#F0FDF4', padding: '18px', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                  <span style={{ fontSize: '12px', color: '#065F46', textTransform: 'uppercase', fontWeight: 'bold' }}>Auto-Deducted (Online)</span>
                  <h2 style={{ margin: '8px 0 0 0', color: '#065F46', fontSize: '24px' }}>
                    ₱{metrics.onlineRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
                <div style={{ background: '#F0FDF4', padding: '18px', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                  <span style={{ fontSize: '12px', color: '#065F46', textTransform: 'uppercase', fontWeight: 'bold' }}>Over-The-Counter Cash</span>
                  <h2 style={{ margin: '8px 0 0 0', color: '#065F46', fontSize: '24px' }}>
                    ₱{metrics.counterRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
                <div style={{ background: '#047857', color: 'white', padding: '18px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total e-OR Records</span>
                  <div style={{ marginTop: '8px', color: 'white', fontSize: '24px', fontWeight: '700' }}>
                    {transactions.length.toLocaleString()}
                    <span style={{ marginLeft: '6px', fontSize: '14px', fontWeight: '600' }}>
                      {transactions.length === 1 ? 'Record' : 'Records'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Collections Table */}
              <h4 style={{ color: '#065F46', marginBottom: '12px' }}>Recent Database Collections</h4>
              <input
                type="search"
                value={analyticsSearch}
                onChange={(event) => setAnalyticsSearch(event.target.value)}
                placeholder="Search e-OR number, taxpayer name, or transaction code"
                aria-label="Search recent collections and analytics"
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', marginBottom: '12px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
              />
              {loading ? (
                <div style={{ color: '#059669', fontWeight: 'bold', padding: '20px', textAlign: 'center' }}>Loading live records from database...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F0FDF4', borderBottom: '1px solid #D1FAE5', color: '#065F46' }}>
                      <th style={{ padding: '10px 14px' }}>e-OR Number</th>
                      <th style={{ padding: '10px 14px' }}>Taxpayer</th>
                      <th style={{ padding: '10px 14px' }}>Tax Type</th>
                      <th style={{ padding: '10px 14px' }}>Amount</th>
                      <th style={{ padding: '10px 14px' }}>Method</th>
                      <th style={{ padding: '10px 14px' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 && (
                      <tr><td colSpan="6" style={{ padding: '14px', color: '#6B7280' }}>No collections match this search.</td></tr>
                    )}
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '10px 14px', fontWeight: '600' }}>{tx.e_or_number}</td>
                        <td style={{ padding: '10px 14px' }}>{tx.taxpayer_name || `Taxpayer #${tx.taxpayer_id}`}</td>
                        <td style={{ padding: '10px 14px', color: '#4B5563' }}>{tx.tax_type}</td>
                        <td style={{ padding: '10px 14px', fontWeight: '700', color: '#065F46' }}>₱{tx.amount}</td>
                        <td style={{ padding: '10px 14px', color: '#4B5563' }}>{tx.payment_method}</td>
                        <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: '12px' }}>{tx.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: QUEUE MANAGEMENT */}
          {activeTab === 'queue' && (
            <div>
              <h3 style={{ color: '#065F46', marginTop: 0, fontSize: '18px' }}>🎟️ Live Capitol Virtual Queue Management</h3>
              <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '20px' }}>
                Monitor real-time virtual queuing pass requests generated by taxpayers from the public portal.
              </p>

              {queueTickets.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#6B7280' }}>
                  Wala pang aktibong nakapilang ticket sa Aiven Cloud database.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F0FDF4', borderBottom: '1px solid #D1FAE5', color: '#065F46' }}>
                      <th style={{ padding: '10px 14px' }}>Ticket Number</th>
                      <th style={{ padding: '10px 14px' }}>Taxpayer / Payer</th>
                      <th style={{ padding: '10px 14px' }}>Department / Service</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '10px 14px' }}>Time Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueTickets.map((q) => (
                      <tr key={q.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 'bold', color: '#065F46' }}>{q.ticket_number}</td>
                        <td style={{ padding: '10px 14px' }}>{q.taxpayer_name}</td>
                        <td style={{ padding: '10px 14px', color: '#4B5563' }}>{q.service_type}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                            {q.status || 'Waiting'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: '12px' }}>{q.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 3: USER ACCOUNTS & RBAC */}
          {activeTab === 'users' && (
            <div>
              <h3 style={{ color: '#065F46', marginTop: 0, fontSize: '18px' }}>User Account & Role-Based Access Control (RBAC)</h3>
              <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '20px' }}>
                Manage user permissions and system access levels for Administrators, Cashiers, and Taxpayers.
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F0FDF4', borderBottom: '1px solid #D1FAE5', color: '#065F46' }}>
                    <th style={{ padding: '10px 14px' }}>User ID</th>
                    <th style={{ padding: '10px 14px' }}>Name / Identity</th>
                    <th style={{ padding: '10px 14px' }}>Role</th>
                    <th style={{ padding: '10px 14px' }}>Assigned Counter</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '600' }}>{user.id}</td>
                      <td style={{ padding: '10px 14px' }}>{user.full_name} ({user.email})</td>
                      <td style={{ padding: '10px 14px', fontWeight: 'bold', color: '#065F46' }}>{user.role}</td>
                      <td style={{ padding: '10px 14px', color: '#6B7280' }}>{user.role === 'admin' ? 'All System Portals' : user.role === 'cashier' ? 'Treasury Counter' : 'Public Client Portal'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}><span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: TAX RATES & FEE CONFIG */}
          {activeTab === 'tax_config' && (
            <div>
              <h3 style={{ color: '#065F46', marginTop: 0, fontSize: '18px' }}>Tax & Fee Computation Settings</h3>
              <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '20px' }}>
                Update rates only after confirming the applicable provincial ordinance. Configured values are stored in the database; they do not automatically assess or charge a payment.
              </p>
              {taxRatesLoading ? (
                <p>Loading tax-rate configuration...</p>
              ) : taxRatesError ? (
                <p role="alert" style={{ color: '#B91C1C' }}>{taxRatesError}</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F0FDF4', borderBottom: '1px solid #D1FAE5', color: '#065F46' }}>
                      <th style={{ padding: '10px 14px' }}>Tax / Fee</th>
                      <th style={{ padding: '10px 14px' }}>Rate</th>
                      <th style={{ padding: '10px 14px' }}>Flat Fee</th>
                      <th style={{ padding: '10px 14px' }}>Configuration</th>
                      <th style={{ padding: '10px 14px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxRates.map((rate) => (
                      <tr key={rate.tax_type} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '10px 14px' }}>{rate.tax_type}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <input aria-label={`${rate.tax_type} rate percent`} type="number" min="0" max="100" step="0.0001" value={rate.rate_percent ?? ''} onChange={(event) => setTaxRates((current) => current.map((item) => item.id === rate.id ? { ...item, rate_percent: event.target.value } : item))} style={{ width: '100px', padding: '7px', border: '1px solid #D1D5DB', borderRadius: '5px' }} /> %
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input aria-label={`${rate.tax_type} flat fee`} type="number" min="0" step="0.01" value={rate.flat_fee ?? ''} onChange={(event) => setTaxRates((current) => current.map((item) => item.id === rate.id ? { ...item, flat_fee: event.target.value } : item))} style={{ width: '100px', padding: '7px', border: '1px solid #D1D5DB', borderRadius: '5px' }} />
                        </td>
                        <td style={{ padding: '10px 14px' }}>{Number(rate.configured) === 1 ? 'Configured' : 'Not configured'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <button type="button" disabled={savingTaxRateId === rate.id || rate.rate_percent === '' || rate.rate_percent === null || rate.flat_fee === '' || rate.flat_fee === null} onClick={() => saveTaxRate(rate)} style={{ padding: '7px 12px', background: '#047857', color: '#FFFFFF', border: 0, borderRadius: '5px', cursor: savingTaxRateId === rate.id ? 'wait' : 'pointer' }}>
                            {savingTaxRateId === rate.id ? 'Saving...' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {taxRateSaveError && <p role="alert" style={{ color: '#B91C1C' }}>{taxRateSaveError}</p>}
            </div>
          )}

          {/* TAB 5: TRANSACTION DIGITAL LEDGER */}
          {activeTab === 'blockchain' && (
            <div>
              <h3 style={{ color: '#065F46', marginTop: 0, fontSize: '18px' }}>Transaction Digital Ledger</h3>
              <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '20px' }}>
                New transactions are linked in an application-managed SHA-256 hash chain. It is not a public blockchain or independently immutable against database administrators.
              </p>
              {ledgerIntegrity && (
                <p role="status" style={{ color: ledgerIntegrity.valid ? '#065F46' : '#B91C1C', fontWeight: '700' }}>
                  Ledger integrity: {ledgerIntegrity.valid ? `verified (${ledgerIntegrity.entry_count} entries)` : 'verification failed'}
                </p>
              )}

              <div style={{ background: '#047857', color: '#E6FFFA', padding: '20px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                <p style={{ margin: '0 0 10px 0', color: '#FCD34D', fontWeight: 'bold', fontSize: '14px' }}>LEDGER ENTRIES</p>
                
                {transactions.length === 0 ? (
                  <p style={{ color: '#A7F3D0' }}>No transaction records found.</p>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} style={{ borderBottom: '1px solid #047857', paddingBottom: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                        <p style={{ margin: 0 }}><strong>Transaction #{tx.id}:</strong> {tx.e_or_number} ({tx.tax_type})</p>
                        
                        <span style={{ 
                          background: tx.ledger_status === 'verified' ? '#D1FAE5' : tx.ledger_status === 'invalid' ? '#FEE2E2' : '#E5E7EB', 
                          color: tx.ledger_status === 'verified' ? '#065F46' : tx.ledger_status === 'invalid' ? '#B91C1C' : '#374151', 
                          padding: '3px 8px', 
                          borderRadius: '10px', 
                          fontSize: '11px', 
                          fontWeight: '700',
                          border: `1px solid ${tx.ledger_status === 'verified' ? '#86EFAC' : tx.ledger_status === 'invalid' ? '#FCA5A5' : '#D1D5DB'}`,
                          fontFamily: 'sans-serif'
                        }}>
                          {tx.ledger_status === 'verified' ? `Verified entry #${tx.ledger_index}` : tx.ledger_status === 'invalid' ? 'Integrity check failed' : 'Legacy record'}
                        </span>
                      </div>

                      <p style={{ margin: '4px 0 0 0', wordBreak: 'break-all' }}>
                        <strong>Previous hash:</strong> <span style={{ color: '#6EE7B7' }}>{tx.previous_hash || 'Not ledger-linked'}</span>
                      </p>
                      <p style={{ margin: '4px 0 0 0', wordBreak: 'break-all' }}>
                        <strong>Entry hash:</strong> <span style={{ color: '#6EE7B7' }}>{tx.block_hash}</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: REPORTS & SYSTEM AUDIT LOGS */}
          {activeTab === 'reports' && (
            <div>
              <h3 style={{ color: '#065F46', marginTop: 0, fontSize: '18px' }}>Financial Statements & System Audit Logs</h3>
              <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '20px' }}>
                Export transaction records and review the latest 250 tracked user and administrative actions.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={exportTransactions} disabled={!transactions.length} style={{ padding: '12px 20px', background: '#047857', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: transactions.length ? 'pointer' : 'not-allowed', fontSize: '13px' }}>
                  📄 Export Transactions (CSV)
                </button>
              </div>
              <h4 style={{ color: '#065F46', margin: '24px 0 10px' }}>Recent Audit Events</h4>
              {auditLoading ? <p>Loading audit logs...</p> : auditError ? (
                <p role="alert" style={{ color: '#B91C1C' }}>{auditError}</p>
              ) : auditLogs.length === 0 ? <p>No audit events recorded yet.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead><tr style={{ color: '#065F46' }}><th style={{ padding: '9px' }}>Date</th><th style={{ padding: '9px' }}>User</th><th style={{ padding: '9px' }}>Action</th><th style={{ padding: '9px' }}>Record</th><th style={{ padding: '9px' }}>Details</th></tr></thead>
                    <tbody>{auditLogs.map((entry) => (
                      <tr key={entry.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '9px', whiteSpace: 'nowrap' }}>{entry.created_at}</td>
                        <td style={{ padding: '9px' }}>{entry.actor_email || `User #${entry.actor_id || 'system'}`}</td>
                        <td style={{ padding: '9px' }}>{entry.action}</td>
                        <td style={{ padding: '9px' }}>{entry.entity ? `${entry.entity} #${entry.entity_id || ''}` : '—'}</td>
                        <td style={{ padding: '9px', maxWidth: '300px', wordBreak: 'break-word' }}>{entry.details || '—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </main>
    </div>
  );
}