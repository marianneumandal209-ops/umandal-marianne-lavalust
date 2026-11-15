import React, { useEffect, useState } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';

export default function CashierDashboard() {
  const navigate = useNavigate();

  // Active Tab State (0: Queue Control, 1: Verify & Pay, 2: Assessment Search, 3: Online Monitor, 4: Shift Summary)
  const [activeTab, setActiveTab] = useState('queue');

  // Queue Ticket & Taxpayer Verification States
  const [ticketInput, setTicketInput] = useState('');
  const [scannedPass, setScannedPass] = useState(null);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [queueTickets, setQueueTickets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [listSearch, setListSearch] = useState('');

  // Taxpayer Assessment Search States
  const [searchName, setSearchName] = useState('');
  const [assessmentMessage, setAssessmentMessage] = useState('');

  const loadDashboardData = async () => {
    try {
      let queueData = [];
      let transactionData = [];

      try {
        const queueResponse = await api.get('/get_queue_tickets');
        queueData = queueResponse.data?.data || [];
      } catch (err) {
        console.warn('Queue tickets fetch warning:', err);
      }

      try {
        const transactionResponse = await api.get('/get_all_transactions');
        transactionData = transactionResponse.data?.data || [];
      } catch (err) {
        console.warn('Transactions fetch warning:', err);
      }

      setQueueTickets(queueData);
      setTransactions(transactionData);
      setError('');
    } catch (requestError) {
      console.error('Error loading cashier data:', requestError);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) loadDashboardData();
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateTicketStatus = async (ticket, status) => {
    setWorking(true);
    setError('');
    try {
      await api.post('/update_queue_ticket', { id: ticket.id, status });
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Hindi na-update ang queue ticket.');
    } finally {
      setWorking(false);
    }
  };

  const currentServing = queueTickets.find((ticket) => ticket.status === 'Serving');
  const onlinePayments = transactions.filter((transaction) => {
    const method = (transaction.payment_method || '').toLowerCase();
    return method.includes('gcash') || method.includes('online') || method.includes('maya') || method.includes('bank');
  });
  const normalizedSearch = listSearch.trim().toLowerCase();
  const filteredOnlinePayments = onlinePayments.filter((transaction) => [
    transaction.taxpayer_name,
    transaction.e_or_number,
    `trx-${transaction.id}-omp`,
    transaction.taxpayer_id
  ].some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch)));
  const filteredQueueTickets = queueTickets.filter((ticket) => [
    ticket.taxpayer_name,
    ticket.ticket_number,
    ticket.id
  ].some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch)));
  const [todayKey] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const reportTransactions = transactions.filter((transaction) => String(transaction.created_at || '').slice(0, 10) === todayKey);
  const cashTotal = reportTransactions
    .filter((transaction) => (transaction.payment_method || '').toLowerCase().includes('cash'))
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const eWalletTotal = reportTransactions
    .filter((transaction) => {
      const method = (transaction.payment_method || '').toLowerCase();
      return method.includes('gcash') || method.includes('maya') || method.includes('online');
    })
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const bankTotal = reportTransactions
    .filter((transaction) => (transaction.payment_method || '').toLowerCase().includes('bank'))
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const otherTotal = reportTransactions
    .filter((transaction) => {
      const method = (transaction.payment_method || '').toLowerCase();
      return !method.includes('cash')
        && !method.includes('gcash')
        && !method.includes('maya')
        && !method.includes('online')
        && !method.includes('bank');
    })
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const totalCollected = reportTransactions.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const exportShiftReport = () => {
    const columns = ['id', 'e_or_number', 'taxpayer_name', 'taxpayer_id', 'tax_type', 'amount', 'payment_method', 'created_at'];
    const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [
      columns.join(','),
      ...reportTransactions.map((transaction) => columns.map((column) => escapeCsv(transaction[column])).join(','))
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindoropay-shift-report-${todayKey}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  // Button Hover Style Helper
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
            {/* Pabilog na Logo Icon */}
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
                Treasury Cashier & Collection Portal
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={async () => {
            await api.post('/logout');
            navigate('/login', { replace: true });
          }}
          style={{ 
            padding: '8px 16px', 
            background: '#DC2626', 
            color: 'white', 
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
      </header>

      {/* Main Body */}
      <main className="portal-main" style={{ padding: '24px 32px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Navigation Buttons Row sa Pagitan ng Header Line at Content Box */}
        <div className="portal-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button style={getButtonStyle('queue')} onClick={() => setActiveTab('queue')}>
            Live Queue Control
          </button>
          
          <button style={getButtonStyle('verify')} onClick={() => setActiveTab('verify')}>
            Ticket Verification & Payment
          </button>
          
          <button style={getButtonStyle('assessment')} onClick={() => setActiveTab('assessment')}>
            Assessment Search
          </button>
          
          <button style={getButtonStyle('monitor')} onClick={() => setActiveTab('monitor')}>
            Online Payment Monitor
          </button>
          
          <button style={getButtonStyle('summary')} onClick={() => setActiveTab('summary')}>
            Shift Collection Summary
          </button>
        </div>

        {/* Dynamic Display Content Box */}
        <div className="portal-content" style={{ 
          background: '#FFFFFF', 
          padding: '30px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
          border: '1px solid #D1FAE5' 
        }}>

          {/* TAB 1: LIVE QUEUE CONTROL */}
          {activeTab === 'queue' && (
            <div>
              <h3 style={{ color: '#065F46', marginTop: 0, fontSize: '18px' }}>Smart Queuing Management Controls</h3>
              <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '20px' }}>
                Manage live counter queue flow, call the next taxpayer, recall missed numbers, or transfer to another section.
              </p>
              
              <div style={{ background: '#F0FDF4', padding: '20px', borderRadius: '8px', border: '1px solid #D1FAE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Now Serving Ticket</span>
                  <h1 style={{ color: '#065F46', fontSize: '32px', margin: '4px 0 0 0', fontWeight: '800' }}>{currentServing?.ticket_number || 'No ticket is being served'}</h1>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#059669', fontWeight: '600' }}>{currentServing?.taxpayer_name || 'Queue updates are stored in the database.'}</p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button disabled={working || !queueTickets.some((ticket) => ticket.status === 'Waiting')} onClick={() => {
                    const nextTicket = [...queueTickets].reverse().find((ticket) => ticket.status === 'Waiting');
                    if (nextTicket) updateTicketStatus(nextTicket, 'Serving');
                  }} style={{ padding: '10px 18px', background: '#047857', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: working ? 'wait' : 'pointer', fontSize: '13px' }}>
                    Call Next ➡
                  </button>
                  <button disabled={working || !currentServing} onClick={() => currentServing && updateTicketStatus(currentServing, 'Recalled')} style={{ padding: '10px 18px', background: '#D97706', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: working ? 'wait' : 'pointer', fontSize: '13px' }}>
                    Recall 🔄
                  </button>
                  <button disabled={working || !currentServing} onClick={() => currentServing && updateTicketStatus(currentServing, 'Transferred')} style={{ padding: '10px 18px', background: '#4B5563', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: working ? 'wait' : 'pointer', fontSize: '13px' }}>
                    Transfer ↗
                  </button>
                </div>
              </div>
              {error && <p role="alert" style={{ color: '#B91C1C' }}>{error}</p>}
              {loading ? <p>Loading live queue...</p> : (
                <>
                <input type="search" value={listSearch} onChange={(event) => setListSearch(event.target.value)} placeholder="Search taxpayer name or ticket number" aria-label="Search queue list" style={{ width: '100%', boxSizing: 'border-box', marginTop: '18px', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                <table style={{ width: '100%', marginTop: '12px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead><tr style={{ color: '#065F46' }}><th>Ticket</th><th>Taxpayer</th><th>Service</th><th>Status</th></tr></thead>
                  <tbody>{filteredQueueTickets.map((ticket) => (
                    <tr key={ticket.id} style={{ borderTop: '1px solid #D1FAE5' }}>
                      <td>{ticket.ticket_number}</td><td>{ticket.taxpayer_name}</td><td>{ticket.service_type}</td><td>{ticket.status}</td>
                    </tr>
                  ))}</tbody>
                </table>
                </>
              )}
            </div>
          )}

          {/* TAB 2: VERIFICATION & PAYMENT */}
          {activeTab === 'verify' && (
            <div>
              <h3 style={{ color: '#065F46', marginTop: 0, fontSize: '18px' }}>Queue Ticket & Taxpayer Verification</h3>
              <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '20px' }}>
                Enter or scan the taxpayer's Virtual Queue Pass number to pull up records and settle over-the-counter accounts.
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                const ticket = queueTickets.find((item) => item.ticket_number.toLowerCase() === ticketInput.trim().toLowerCase());
                if (ticket) {
                  setScannedPass(ticket);
                  setPaymentAmount('');
                  setPaymentProcessed(false);
                  setError('');
                } else {
                  setScannedPass(null);
                  setError('Walang queue ticket na tumutugma sa number na ito.');
                }
              }} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                  type="text" 
                  placeholder="Enter Queue Ticket (e.g. OMP-Q-2026-401)" 
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none' }}
                  required
                />
                <button type="submit" style={{ padding: '12px 24px', background: '#047857', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                  Verify Ticket
                </button>
              </form>
              {error && <p role="alert" style={{ color: '#B91C1C' }}>{error}</p>}

              {scannedPass && (
                <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '8px', border: '2px solid #047857' }}>
                  <h4 style={{ color: '#065F46', margin: '0 0 12px 0' }}>Active Queue & Tax Details</h4>
                  <div style={{ fontSize: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    <p style={{ margin: 0 }}><strong>Ticket:</strong> {scannedPass.ticket_number}</p>
                    <p style={{ margin: 0 }}><strong>Name:</strong> {scannedPass.taxpayer_name}</p>
                    <p style={{ margin: 0 }}><strong>Tax Type:</strong> {scannedPass.tax_type}</p>
                  </div>

                  {!paymentProcessed ? (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setWorking(true);
                      setError('');
                      try {
                        await api.post('/process_payment', {
                          taxpayer_id: scannedPass.taxpayer_id,
                          queue_ticket_id: scannedPass.id,
                          tax_type: scannedPass.tax_type,
                          amount: paymentAmount,
                          payment_method: 'Cash Over-the-Counter'
                        });
                        setPaymentProcessed(true);
                        await loadDashboardData();
                      } catch (requestError) {
                        setError(requestError.response?.data?.message || 'Hindi naitala ang bayad.');
                      } finally {
                        setWorking(false);
                      }
                    }}>
                      <label style={{ display: 'block', marginBottom: '12px' }}>
                        Halagang babayaran (PHP)
                        <input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required style={{ display: 'block', width: '100%', padding: '10px', marginTop: '6px', boxSizing: 'border-box' }} />
                      </label>
                      <button type="submit" disabled={working} style={{ width: '100%', padding: '12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: working ? 'wait' : 'pointer', fontSize: '14px' }}>
                        {working ? 'Recording payment...' : 'Record Cash Payment'}
                      </button>
                    </form>
                  ) : (
                    <div style={{ background: '#D1FAE5', color: '#065F46', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: '700', fontSize: '14px' }}>
                      ✔ Payment record saved.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSESSMENT SEARCH */}
          {activeTab === 'assessment' && (
            <div>
              <h3 style={{ color: '#065F46', marginTop: 0, fontSize: '18px' }}>Taxpayer Assessment Search</h3>
              <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '20px' }}>
                Search taxpayer records and verify tax assessment histories prior to payment counter processing.
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                setAssessmentMessage('Walang property assessment table o API na naka-configure. Hindi nagpakita ng mock assessment data.');
              }} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                  type="text" 
                  placeholder="Enter Taxpayer Name or Property PIN..." 
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none' }}
                  required
                />
                <button type="submit" style={{ padding: '12px 24px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                  Search Records
                </button>
              </form>

              {assessmentMessage && <p role="status" style={{ color: '#92400E', background: '#FEF3C7', padding: '12px', borderRadius: '8px' }}>{assessmentMessage}</p>}
              {!assessmentMessage && <p style={{ color: '#6B7280' }}>Assessment lookup is unavailable because no assessment data table or API is configured yet.</p>}
            </div>
          )}

          {/* TAB 4: ONLINE PAYMENT MONITOR */}
          {activeTab === 'monitor' && (
            <div>
              <h3 style={{ color: '#065F46', marginTop: 0, fontSize: '18px' }}>Real-time Online Payment Monitor</h3>
              <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '16px' }}>
                Live tracking of auto-deducted electronic payments processed through GCash and partner banks.
              </p>

              <input type="search" value={listSearch} onChange={(event) => setListSearch(event.target.value)} placeholder="Search taxpayer name, e-OR, or transaction code" aria-label="Search online payments" style={{ width: '100%', boxSizing: 'border-box', marginBottom: '14px', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F0FDF4', borderBottom: '1px solid #D1FAE5', color: '#065F46' }}>
                    <th style={{ padding: '10px 14px' }}>Trx Code</th>
                    <th style={{ padding: '10px 14px' }}>Taxpayer</th>
                    <th style={{ padding: '10px 14px' }}>Tax Type</th>
                    <th style={{ padding: '10px 14px' }}>Amount</th>
                    <th style={{ padding: '10px 14px' }}>Method</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOnlinePayments.map(op => (
                    <tr key={op.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '600' }}>{op.e_or_number || `TRX-${op.id}-OMP`}</td>
                      <td style={{ padding: '10px 14px' }}>{op.taxpayer_name || `Taxpayer #${op.taxpayer_id}`}</td>
                      <td style={{ padding: '10px 14px', color: '#4B5563' }}>{op.tax_type}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#065F46' }}>₱{op.amount}</td>
                      <td style={{ padding: '10px 14px', color: '#6B7280' }}>{op.payment_method}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>Recorded</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: SHIFT SUMMARY */}
          {activeTab === 'summary' && (
            <div>
              <h3 style={{ color: '#065F46', marginTop: 0, fontSize: '18px' }}>📊 Shift Collection Summary & Reconciliation</h3>
              <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '20px' }}>
                End-of-shift financial summary for counter cash and digital collection reconciliation.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                  <span style={{ fontSize: '11px', color: '#065F46', textTransform: 'uppercase', fontWeight: 'bold' }}>Cash Collected</span>
                  <h2 style={{ margin: '6px 0 0 0', fontSize: '22px', color: '#065F46' }}>₱{cashTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                </div>
                <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                  <span style={{ fontSize: '11px', color: '#065F46', textTransform: 'uppercase', fontWeight: 'bold' }}>E-Wallet Total</span>
                  <h2 style={{ margin: '6px 0 0 0', fontSize: '22px', color: '#065F46' }}>₱{eWalletTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                </div>
                <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                  <span style={{ fontSize: '11px', color: '#065F46', textTransform: 'uppercase', fontWeight: 'bold' }}>Bank Total</span>
                  <h2 style={{ margin: '6px 0 0 0', fontSize: '22px', color: '#065F46' }}>₱{bankTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                </div>
                <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
                  <span style={{ fontSize: '11px', color: '#065F46', textTransform: 'uppercase', fontWeight: 'bold' }}>Other Methods</span>
                  <h2 style={{ margin: '6px 0 0 0', fontSize: '22px', color: '#065F46' }}>₱{otherTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                </div>
                <div style={{ background: '#047857', color: 'white', padding: '16px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Shift Collections</span>
                  <div style={{ marginTop: '6px', color: 'white', fontSize: '22px', fontWeight: '700' }}>
                    ₱{totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <p style={{ color: '#6B7280', fontSize: '13px' }}>Daily totals are based on saved transactions dated {todayKey}; the report includes all payment methods recorded today.</p>
              <button type="button" onClick={exportShiftReport} style={{ padding: '11px 18px', background: '#047857', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                Export Today's Shift Report (CSV)
              </button>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}