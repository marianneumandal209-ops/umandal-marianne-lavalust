import React, { useState, useEffect } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';

export default function TaxpayerDashboard() {
  const navigate = useNavigate();

  const [hoverQueue, setHoverQueue] = useState(false);
  const [hoverPayment, setHoverPayment] = useState(false);
  const [hoverReceipts, setHoverReceipts] = useState(false);
  const [hoverProfile, setHoverProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureError, setFeatureError] = useState('');
  const [featureSuccess, setFeatureSuccess] = useState('');
  
  // Dynamic form states para sa pag-link ng bagong payment account
  const [provider, setProvider] = useState('GCash');
  const [displayName, setDisplayName] = useState('');
  const [accountLast4, setAccountLast4] = useState('');

  const loadPaymentMethods = async () => {
    try {
      const { data } = await api.get('/payment_methods');
      setPaymentMethods(data.data || []);
    } catch (err) {
      // Silent fail
    }
  };

  const loadInitialOverviewData = async () => {
    try {
      const [txRes, pmRes] = await Promise.allSettled([
        api.get('/get_transactions'),
        api.get('/payment_methods')
      ]);
      if (txRes.status === 'fulfilled') {
        setTransactions(txRes.value.data?.data || []);
      }
      if (pmRes.status === 'fulfilled') {
        setPaymentMethods(pmRes.value.data?.data || []);
      }
    } catch (error) {
      // Silent fail
    }
  };

  useEffect(() => {
    loadInitialOverviewData();
  }, []);

  const openFeatureTab = async (tab) => {
    setActiveTab(tab);
    setFeatureLoading(true);
    setFeatureError('');
    setFeatureSuccess('');
    try {
      if (tab === 'transactions') {
        const { data } = await api.get('/get_transactions');
        setTransactions(data.data || []);
      } else {
        await loadPaymentMethods();
      }
    } catch (error) {
      setFeatureError(error.response?.data?.message || 'Unable to load information. Please try again.');
    } finally {
      setFeatureLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    setFeatureLoading(true);
    setFeatureError('');
    setFeatureSuccess('');
    try {
      await api.post('/payment_methods', {
        provider,
        display_name: displayName,
        account_last4: accountLast4
      });
      setFeatureSuccess('Payment method linked successfully!');
      setDisplayName('');
      setAccountLast4('');
      await loadPaymentMethods();
    } catch (err) {
      setFeatureError(err.response?.data?.message || 'Failed to add payment method.');
    } finally {
      setFeatureLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (id) => {
    try {
      await api.delete(`/payment_methods/${id}`);
      await loadPaymentMethods();
    } catch (err) {
      setFeatureError('Failed to remove payment method.');
    }
  };

  const defaultAccount = paymentMethods.find((m) => Number(m.is_default) === 1) || paymentMethods[0];
  const recentTransactions = transactions.slice(0, 5);
  const completedCount = transactions.filter((t) => (t.status || 'Paid').toLowerCase() === 'paid').length;
  const compliancePercentage = transactions.length > 0 ? Math.min(100, Math.round((completedCount / transactions.length) * 100)) : 85;

  return (
    <div className="portal-shell" style={{ minHeight: '100vh', background: '#F0FDF4', fontFamily: 'sans-serif', paddingBottom: '48px' }}>
      
      {/* Top Header Navigation Bar */}
      <header className="portal-header" style={{ 
        background: '#047857', 
        padding: '16px 32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderBottom: '2px solid #065F46' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ color: '#FCD34D', fontSize: '10px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
            REPUBLIC OF THE PHILIPPINES • PROVINCE OF ORIENTAL MINDORO
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
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
                Taxpayer Dashboard
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/profile')} 
            onMouseEnter={() => setHoverProfile(true)}
            onMouseLeave={() => setHoverProfile(false)}
            style={{ 
              padding: '8px 16px', 
              background: hoverProfile ? '#059669' : '#10B981', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: '600', 
              cursor: 'pointer', 
              fontSize: '13px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            My Profile
          </button>
          
          <button 
            onClick={async () => {
              await api.post('/logout');
              navigate('/login', { replace: true });
            }}
            style={{ 
              padding: '8px 16px', 
              background: '#10B981', 
              color: 'white', 
              border: '1px solid #34D399', 
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

      {/* Main Content Area */}
      <main className="portal-main" style={{ padding: '24px 32px', maxWidth: '1140px', margin: '0 auto' }}>
        
        {/* Navigation Buttons Bar */}
        <div className="portal-tabs" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('overview')} 
            style={{ 
              padding: '8px 18px', 
              background: activeTab === 'overview' ? '#047857' : '#FFFFFF', 
              color: activeTab === 'overview' ? '#FFFFFF' : '#047857', 
              border: '2px solid #047857', 
              borderRadius: '6px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              fontSize: '13px',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Dashboard Overview
          </button>

          <button 
            onClick={() => navigate('/queue-pass')} 
            onMouseEnter={() => setHoverQueue(true)}
            onMouseLeave={() => setHoverQueue(false)}
            style={{ 
              padding: '8px 18px', 
              background: hoverQueue ? '#047857' : '#FFFFFF', 
              color: hoverQueue ? '#FFFFFF' : '#047857', 
              border: '2px solid #047857', 
              borderRadius: '6px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              fontSize: '13px',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Queue Pass
          </button>

          <button 
            onClick={() => navigate('/payment')} 
            onMouseEnter={() => setHoverPayment(true)}
            onMouseLeave={() => setHoverPayment(false)}
            style={{ 
              padding: '8px 18px', 
              background: hoverPayment ? '#047857' : '#FFFFFF', 
              color: hoverPayment ? '#FFFFFF' : '#047857', 
              border: '2px solid #047857', 
              borderRadius: '6px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              fontSize: '13px',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Payment & Auto-Deducted
          </button>

          <button 
            onClick={() => navigate('/receipt-vault')} 
            onMouseEnter={() => setHoverReceipts(true)}
            onMouseLeave={() => setHoverReceipts(false)}
            style={{ 
              padding: '8px 18px', 
              background: hoverReceipts ? '#047857' : '#FFFFFF', 
              color: hoverReceipts ? '#FFFFFF' : '#047857', 
              border: '2px solid #047857', 
              borderRadius: '6px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              fontSize: '13px',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Digital Receipts (e-OR Vault)
          </button>

          <button
            onClick={() => openFeatureTab('transactions')}
            style={{
              padding: '8px 18px',
              background: activeTab === 'transactions' ? '#047857' : '#FFFFFF',
              color: activeTab === 'transactions' ? '#FFFFFF' : '#047857',
              border: '2px solid #047857',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Transaction History & Ledger
          </button>

          <button
            onClick={() => openFeatureTab('accounts')}
            style={{
              padding: '8px 18px',
              background: activeTab === 'accounts' ? '#047857' : '#FFFFFF',
              color: activeTab === 'accounts' ? '#FFFFFF' : '#047857',
              border: '2px solid #047857',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Linked Payment Accounts
          </button>
        </div>

        {activeTab === 'overview' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Hero Welcome Banner */}
            <div style={{ 
              background: 'linear-gradient(135deg, #065F46 0%, #047857 60%, #10B981 100%)', 
              borderRadius: '14px', 
              padding: '28px 32px', 
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              boxShadow: '0 6px 18px rgba(4, 120, 87, 0.18)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ maxWidth: '620px', zIndex: 1 }}>
                <span style={{ 
                  background: 'rgba(255,255,255,0.16)', 
                  padding: '4px 10px', 
                  borderRadius: '999px', 
                  fontSize: '11px', 
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  display: 'inline-block',
                  marginBottom: '10px'
                }}>
                  PROVINCIAL CAPITOL E-SERVICES PORTAL
                </span>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.3px', color: '#FFFFFF' }}>
                  Welcome, Taxpayer!
                </h2>
                <p style={{ margin: 0, color: '#D1FAE5', fontSize: '14px', lineHeight: '1.6' }}>
                  Access your digital QR queue tickets, pay provincial taxes online, and download verified electronic official receipts (e-OR) anytime.
                </p>
              </div>

              {/* Stylized Graphic Badge on Right */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.14)', 
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                zIndex: 1
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  background: '#FFFFFF', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  📱
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#A7F3D0', fontWeight: '600' }}>Digital Verification</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF' }}>QR & SHA-256 Active</div>
                </div>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', 
              gap: '24px',
              alignItems: 'start'
            }}>
              
              {/* LEFT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Active Queue Pass Card */}
                <div style={{ 
                  background: '#FFFFFF', 
                  borderRadius: '14px', 
                  padding: '22px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)', 
                  border: '1px solid #D1FAE5' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: '#065F46', fontSize: '16px', fontWeight: '800' }}>Active Queue Pass</h3>
                    <span style={{ fontSize: '18px' }}>🎫</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <div style={{ 
                      width: '88px', 
                      height: '88px', 
                      border: '2px solid #047857', 
                      borderRadius: '10px', 
                      padding: '6px',
                      background: '#F0FDF4',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="72" height="72" viewBox="0 0 24 24" fill="#065F46">
                        <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v2h-3v-2zm-3 3h2v2h-2v-2zm3 0h3v2h-3v-2z" />
                      </svg>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Queue No.</div>
                      <div style={{ fontSize: '28px', fontWeight: '900', color: '#111827', lineHeight: '1.1', margin: '2px 0 8px 0' }}>
                        Q-104
                      </div>
                      <span style={{ 
                        background: '#DCFCE7', 
                        color: '#166534', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '11px', 
                        fontWeight: '700',
                        display: 'inline-block'
                      }}>
                        Your turn is next! (Counter 3)
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/queue-pass')}
                    style={{ 
                      marginTop: '16px',
                      width: '100%',
                      padding: '9px',
                      background: '#F0FDF4',
                      color: '#047857',
                      border: '1px solid #A7F3D0',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Open Full QR Ticket →
                  </button>
                </div>

                {/* Linked Accounts & Quick Pay Card */}
                <div style={{ 
                  background: '#FFFFFF', 
                  borderRadius: '14px', 
                  padding: '22px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)', 
                  border: '1px solid #D1FAE5' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: '#065F46', fontSize: '16px', fontWeight: '800' }}>Linked Accounts & Quick Pay</h3>
                    <span style={{ fontSize: '18px' }}>💳</span>
                  </div>

                  <div style={{ 
                    background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)', 
                    borderRadius: '12px', 
                    padding: '18px', 
                    color: '#FFFFFF',
                    marginBottom: '16px',
                    boxShadow: '0 4px 10px rgba(6, 78, 59, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                      <div style={{ width: '32px', height: '22px', background: '#FCD34D', borderRadius: '4px', opacity: 0.9 }} />
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#A7F3D0' }}>
                        {defaultAccount ? defaultAccount.provider : 'GCash / E-Wallet'}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', letterSpacing: '2px', fontFamily: 'monospace', marginBottom: '6px' }}>
                      •••• •••• •••• {defaultAccount ? defaultAccount.account_last4 : '8842'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#D1FAE5' }}>
                      <span>{defaultAccount ? defaultAccount.display_name : 'Primary Tax Account'}</span>
                      <span style={{ display: 'flex', gap: '3px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block', marginLeft: '-6px' }} />
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/payment')}
                    style={{ 
                      width: '100%', 
                      padding: '11px 16px', 
                      background: '#065F46', 
                      color: '#FFFFFF', 
                      border: 'none', 
                      borderRadius: '8px', 
                      fontWeight: '700', 
                      fontSize: '13px', 
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(6, 95, 70, 0.25)'
                    }}
                  >
                    Pay Amortization / Business Tax
                  </button>
                </div>

              </div>

              {/* RIGHT COLUMN */}
              <div style={{ 
                gridColumn: 'span 2',
                background: '#FFFFFF', 
                borderRadius: '14px', 
                padding: '22px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)', 
                border: '1px solid #D1FAE5' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', color: '#065F46', fontSize: '17px', fontWeight: '800' }}>
                      Recent Transactions & Documents
                    </h3>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      Latest provincial revenue payments and downloadable e-OR certificates
                    </span>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    background: '#F0FDF4', 
                    padding: '8px 14px', 
                    borderRadius: '10px', 
                    border: '1px solid #A7F3D0' 
                  }}>
                    <div style={{ 
                      width: '38px', 
                      height: '38px', 
                      borderRadius: '50%', 
                      border: '3px solid #10B981', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '11px',
                      color: '#065F46',
                      background: '#FFFFFF'
                    }}>
                      {compliancePercentage}%
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#065F46' }}>Payment Status</div>
                      <div style={{ fontSize: '10px', color: '#047857' }}>Verified & Updated</div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ color: '#065F46', borderBottom: '2px solid #ECFDF5', fontSize: '12px' }}>
                        <th style={{ padding: '10px 8px' }}>Status</th>
                        <th style={{ padding: '10px 8px' }}>e-OR / Reference</th>
                        <th style={{ padding: '10px 8px' }}>Tax Type</th>
                        <th style={{ padding: '10px 8px' }}>Date</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right' }}>e-OR Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.length > 0 ? recentTransactions.map((tx) => (
                        <tr key={tx.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ 
                              background: '#DCFCE7', 
                              color: '#166534', 
                              padding: '4px 10px', 
                              borderRadius: '999px', 
                              fontSize: '11px', 
                              fontWeight: '700' 
                            }}>
                              Paid
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', fontWeight: '700', color: '#1F2937' }}>{tx.e_or_number}</td>
                          <td style={{ padding: '12px 8px', color: '#4B5563' }}>{tx.tax_type}</td>
                          <td style={{ padding: '12px 8px', color: '#6B7280', fontSize: '12px' }}>{tx.created_at}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <button 
                              onClick={() => navigate('/receipt-vault')}
                              style={{ 
                                padding: '6px 12px', 
                                background: '#047857', 
                                color: '#FFFFFF', 
                                border: 'none', 
                                borderRadius: '6px', 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                cursor: 'pointer' 
                              }}
                            >
                              ⬇ Download
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                            No recorded payments yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '14px', textAlign: 'right' }}>
                  <button 
                    onClick={() => openFeatureTab('transactions')}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: '#047857', 
                      fontWeight: '700', 
                      fontSize: '12px', 
                      cursor: 'pointer' 
                    }}
                  >
                    View Full Ledger Hash Trail →
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="portal-content" style={{ 
            background: '#FFFFFF', 
            padding: '30px', 
            borderRadius: '12px', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
            border: '1px solid #D1FAE5' 
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{ marginBottom: '18px', padding: '8px 12px', border: '1px solid #047857', borderRadius: '6px', color: '#047857', background: 'white', cursor: 'pointer', fontWeight: '600' }}
            >
              ← Back to Dashboard
            </button>

            {activeTab === 'transactions' ? (
              <>
                <h3 style={{ color: '#065F46', marginTop: 0 }}>Transaction History & Ledger Trail</h3>
                <p style={{ color: '#4B5563', fontSize: '14px' }}>Your recorded tax payments and ledger verification hashes.</p>
                {featureLoading ? <p>Loading transaction history...</p> : featureError ? (
                  <p role="alert" style={{ color: '#B91C1C' }}>{featureError}</p>
                ) : transactions.length === 0 ? <p>No recorded payments yet.</p> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="ledger-history-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <colgroup>
                        <col style={{ width: '160px' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '200px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '360px' }} />
                        <col style={{ width: '140px' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ color: '#065F46', borderBottom: '1px solid #D1FAE5' }}>
                          <th style={{ padding: '10px' }}>Date</th>
                          <th style={{ padding: '10px' }}>e-OR</th>
                          <th style={{ padding: '10px' }}>Tax Type</th>
                          <th style={{ padding: '10px' }}>Amount</th>
                          <th style={{ padding: '10px' }}>Verification Hash</th>
                          <th style={{ padding: '10px' }}>Ledger Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '10px' }}>{transaction.created_at}</td>
                            <td style={{ padding: '10px' }}>{transaction.e_or_number}</td>
                            <td style={{ padding: '10px' }}>{transaction.tax_type}</td>
                            <td style={{ padding: '10px' }}>₱{Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="ledger-hash-cell" style={{ padding: '10px', fontFamily: 'monospace' }}>
                              <div className="ledger-hash-value">Entry: {transaction.block_hash || 'Not ledger-linked'}</div>
                              {transaction.previous_hash && <div className="ledger-hash-value ledger-previous-hash">Previous: {transaction.previous_hash}</div>}
                            </td>
                            <td style={{ padding: '10px' }}>{transaction.ledger_status || 'legacy'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div>
                <h3 style={{ color: '#065F46', marginTop: 0 }}>Linked Payment Accounts</h3>
                <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '20px' }}>Manage your linked e-wallet and bank accounts.</p>

                {/* Form para sa pag-link ng bagong payment account (Dynamic / Non-hardcoded) */}
                <div style={{ background: '#F0FDF4', padding: '20px', borderRadius: '10px', border: '1px solid #A7F3D0', marginBottom: '24px' }}>
                  <h4 style={{ color: '#065F46', margin: '0 0 12px 0', fontSize: '15px' }}>Link New Payment Account</h4>
                  
                  {featureError && <p style={{ color: '#B91C1C', fontSize: '13px', marginBottom: '10px' }}>{featureError}</p>}
                  {featureSuccess && <p style={{ color: '#166534', fontSize: '13px', marginBottom: '10px' }}>{featureSuccess}</p>}

                  <form onSubmit={handleAddPaymentMethod} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Provider</label>
                      <select 
                        value={provider} 
                        onChange={(e) => setProvider(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px' }}
                      >
                        <option value="GCash">GCash</option>
                        <option value="Maya">Maya</option>
                        <option value="Bank">Bank</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Account Label / Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. My Savings / Personal" 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', boxSizing: 'border-box' }}
                        required 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Last 4 Digits</label>
                      <input 
                        type="text" 
                        maxLength="4" 
                        placeholder="1234" 
                        value={accountLast4} 
                        onChange={(e) => setAccountLast4(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', boxSizing: 'border-box' }}
                        required 
                      />
                    </div>

                    <div>
                      <button 
                        type="submit" 
                        disabled={featureLoading}
                        style={{ width: '100%', padding: '10px 16px', background: '#047857', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                      >
                        {featureLoading ? 'Linking...' : '+ Link Account'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* List ng mga naka-link na account na nanggagaling sa database */}
                <h4 style={{ color: '#065F46', fontSize: '15px', marginBottom: '12px' }}>Your Linked Accounts</h4>
                {paymentMethods.length === 0 ? (
                  <p style={{ color: '#6B7280', fontSize: '13px' }}>No linked payment accounts found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {paymentMethods.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                        <div>
                          <strong style={{ color: '#1F2937' }}>{m.provider}</strong>: {m.display_name} (•••• {m.account_last4}) 
                          {Number(m.is_default) === 1 && <span style={{ marginLeft: '8px', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>Default</span>}
                        </div>
                        <button 
                          onClick={() => handleDeletePaymentMethod(m.id)}
                          style={{ padding: '6px 12px', background: '#FEE2E2', color: '#B91C1C', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}