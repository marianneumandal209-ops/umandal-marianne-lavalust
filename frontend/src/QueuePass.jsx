import React, { useEffect, useState } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';

export default function QueuePass() {
  const [department, setDepartment] = useState('Provincial Treasurer’s Office (PTO)');
  const [transactionType, setTransactionType] = useState('Real Property Tax Verification');
  const [taxpayerName, setTaxpayerName] = useState('');
  const [queuePass, setQueuePass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/profile')
      .then(({ data }) => setTaxpayerName(data.data.full_name || ''))
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Hindi makuha ang taxpayer profile.');
      });
  }, []);

  // Submit Handler para mag-save sa LavaLust Backend & Aiven Cloud Database
  const handleGeneratePass = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      service_type: `${department} - ${transactionType}`,
      taxpayer_name: taxpayerName
    };

    // Tumawag sa LavaLust Api.php controller endpoint
    api.post('/generate_queue_ticket', payload)
      .then((response) => {
        if (response.data.status === 'success') {
          const apiData = response.data.data;
          
          // I-set ang ticket object mula sa totoong response ng backend
          setQueuePass({
            ticketNumber: apiData.ticket_number,
            department: department,
            transactionType: transactionType,
            taxpayerName: apiData.taxpayer_name,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            status: apiData.status || 'Active / Waiting'
          });
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error generating queue ticket:', error);
        setLoading(false);
        setError(error.response?.data?.message || 'Hindi na-generate ang ticket. Pakisubukan muli.');
      });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0FDF4', fontFamily: 'sans-serif' }}>
      {/* Top Header */}
      <header style={{ background: '#FFFFFF', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #DCFCE7' }}>
        <h2 style={{ color: '#166534', margin: 0, fontSize: '20px', fontWeight: '700' }}>🎟️ Virtual Queuing Pass</h2>
        <button onClick={() => navigate('/taxpayer')} style={{ padding: '8px 16px', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
          Back to Dashboard
        </button>
      </header>

      {/* Main Container */}
      <main style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
        {!queuePass ? (
          <div style={{ background: '#FFFFFF', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #DCFCE7' }}>
            <h3 style={{ color: '#166534', marginTop: 0 }}>Generate Digital Queue Ticket</h3>
            {error && <p role="alert" style={{ color: '#B91C1C' }}>{error}</p>}
            <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '20px' }}>
              Request a virtual queuing pass prior to visiting the Provincial Capitol to skip physical lines.
            </p>

            <form onSubmit={handleGeneratePass}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Taxpayer / Payer Name</label>
                <input 
                  type="text" 
                  value={taxpayerName} 
                  onChange={(e) => setTaxpayerName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Provincial Office / Department</label>
                <select 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none' }}
                >
                  <option value="Provincial Treasurer’s Office (PTO)">Provincial Treasurer’s Office (PTO)</option>
                  <option value="Provincial Assessor’s Office">Provincial Assessor’s Office</option>
                  <option value="Provincial Accountant’s Office">Provincial Accountant’s Office</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Transaction Nature</label>
                <input 
                  type="text" 
                  value={transactionType} 
                  onChange={(e) => setTransactionType(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}
              >
                {loading ? 'Generating Ticket to Cloud Database...' : 'Generate Queue Pass'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #DCFCE7', textAlign: 'center' }}>
            <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px', borderRadius: '8px', fontWeight: '600', marginBottom: '20px' }}>
              Virtual Queue Pass Generated Successfully!
            </div>

            <div style={{ background: '#F9FAFB', padding: '24px', borderRadius: '12px', border: '1px dashed #16A34A', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Ticket Number</span>
              <h1 style={{ color: '#166534', fontSize: '36px', margin: '8px 0 16px 0', fontWeight: '800' }}>{queuePass.ticketNumber}</h1>
              
              <div style={{ textAlign: 'left', fontSize: '14px', color: '#374151', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                <p><strong>Payer Name:</strong> {queuePass.taxpayerName}</p>
                <p><strong>Department:</strong> {queuePass.department}</p>
                <p><strong>Transaction:</strong> {queuePass.transactionType}</p>
                <p><strong>Date & Time:</strong> {queuePass.date} | {queuePass.time}</p>
                <p><strong>Status:</strong> <span style={{ color: '#D97706', fontWeight: '600' }}>{queuePass.status}</span></p>
              </div>

              {/* Simulated QR Code box */}
              <div style={{ marginTop: '20px', background: 'white', padding: '15px', display: 'inline-block', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                <div style={{ width: '120px', height: '120px', background: '#111827', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontFamily: 'monospace' }}>
                  [QR QUEUE CODE]
                </div>
                <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginTop: '6px' }}>Scan at Capitol Counter</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setQueuePass(null)} style={{ flex: 1, padding: '10px', background: '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                Get Another Ticket
              </button>
              <button onClick={() => navigate('/taxpayer')} style={{ flex: 1, padding: '10px', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}