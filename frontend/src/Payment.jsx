import React, { useState, useEffect } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';

export default function Payment() {
  const [taxType, setTaxType] = useState('Real Property Tax (RPT)');
  const [amount, setAmount] = useState('1300.00');
  const [paymentMethod, setPaymentMethod] = useState('Cash Over-the-Counter');
  const [linkedAccounts, setLinkedAccounts] = useState([]);

  const [paid, setPaid] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();

  // I-load ang mga naka-link na payment accounts mula sa database
  useEffect(() => {
    api.get('/payment_methods')
      .then((res) => {
        setLinkedAccounts(res.data.data || []);
      })
      .catch((err) => {
        console.error('Failed to load linked payment methods:', err);
      });
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessingPayment(true);
    setPaymentError('');

    try {
      const response = await api.post('/process_payment', {
        tax_type: taxType,
        amount,
        payment_method: paymentMethod
      });
      const transaction = response.data.data;

      setReceiptData({
        eOrNumber: transaction.e_or_number,
        trxCode: `TRX-${transaction.id}-OMP`,
        taxType: transaction.tax_type,
        amount: transaction.amount,
        paymentMethod: transaction.payment_method,
        timestamp: transaction.created_at,
        blockHash: transaction.block_hash,
        previousHash: transaction.previous_hash,
        ledgerIndex: transaction.ledger_index
      });
      setPaid(true);
    } catch (error) {
      console.error('Error saving payment transaction:', error);
      setPaymentError('Hindi na-save ang transaksyon. Pakisubukan muli.');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0FDF4', fontFamily: 'sans-serif' }}>
      {/* Top Header */}
      <header style={{ background: '#FFFFFF', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #DCFCE7' }}>
        <h2 style={{ color: '#166534', margin: 0, fontSize: '20px', fontWeight: '700' }}>💳 Payment Record</h2>
        <button onClick={() => navigate('/taxpayer')} style={{ padding: '8px 16px', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
          Back to Dashboard
        </button>
      </header>

      {/* Main Container */}
      <main style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
        
        {!paid && (
          <div style={{ background: '#FFFFFF', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #DCFCE7' }}>
            <h3 style={{ color: '#166534', marginTop: 0 }}>Record Provincial Tax Payment</h3>
            <p style={{ color: '#92400E', background: '#FEF3C7', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
              This saves an internal transaction record and receipt reference only. No payment gateway or official government receipt service is connected, and no funds will be charged.
            </p>
            <form onSubmit={handlePayment}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Tax Type</label>
                <select 
                  value={taxType} 
                  onChange={(e) => setTaxType(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none' }}
                >
                  <option value="Real Property Tax (RPT)">Real Property Tax (RPT)</option>
                  <option value="Business Tax">Business Tax</option>
                  <option value="Professional Tax">Professional Tax</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Amount (PHP)</label>
                <input 
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Payment Method</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                >
                  <option value="Cash Over-the-Counter">Cash Over-the-Counter</option>
                  <option value="GCash (Record Only)">GCash (Record Only)</option>
                  <option value="Bank Transfer (Record Only)">Bank Transfer (Record Only)</option>

                  {/* Dynamic Options galing sa mga naka-link na accounts ng taxpayer */}
                  {linkedAccounts.map((acc) => {
                    const formattedOptionName = `${acc.provider} - ${acc.display_name} (•••• ${acc.account_last4})`;
                    return (
                      <option key={acc.id} value={formattedOptionName}>
                        {acc.provider}: {acc.display_name} (•••• {acc.account_last4}) {Number(acc.is_default) === 1 ? '[Default]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {paymentError && (
                <p role="alert" style={{ color: '#B91C1C', fontSize: '14px' }}>{paymentError}</p>
              )}
              <button type="submit" disabled={processingPayment} style={{ width: '100%', padding: '12px', background: processingPayment ? '#86EFAC' : '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: processingPayment ? 'wait' : 'pointer' }}>
                {processingPayment ? 'Saving Transaction...' : 'Save Payment Record'}
              </button>
            </form>
          </div>
        )}

        {/* Saved transaction receipt */}
        {paid && (
          <div style={{ background: '#FFFFFF', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #DCFCE7', textAlign: 'center' }}>
            <div style={{ background: '#DCFCE7', color: '#166534', padding: '12px', borderRadius: '8px', fontWeight: '600', marginBottom: '20px' }}>
              Payment record saved. No funds were charged.
            </div>
            
            <div style={{ textAlign: 'left', background: '#F9FAFB', padding: '20px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', marginBottom: '20px' }}>
              <p><strong>Application Receipt Reference:</strong> {receiptData.eOrNumber}</p>
              <p><strong>Transaction Code:</strong> {receiptData.trxCode}</p>
              <p><strong>Tax Type:</strong> {receiptData.taxType}</p>
              <p><strong>Amount Paid:</strong> ₱{receiptData.amount}</p>
              <p><strong>Payment Method:</strong> {receiptData.paymentMethod}</p>
              <p><strong>Timestamp:</strong> {receiptData.timestamp}</p>
              <p style={{ marginTop: '10px' }}><strong>Digital ledger entry:</strong> {receiptData.ledgerIndex ? `#${receiptData.ledgerIndex}` : 'Pending'}</p>
              <p style={{ wordBreak: 'break-all' }}><strong>Previous entry hash:</strong> <span style={{ fontFamily: 'monospace' }}>{receiptData.previousHash}</span></p>
              <p style={{ wordBreak: 'break-all', marginTop: '10px' }}><strong>SHA-256 ledger hash:</strong> <span style={{ color: '#166534', fontFamily: 'monospace' }}>{receiptData.blockHash}</span></p>
              <p style={{ color: '#4B5563', fontSize: '12px' }}>This is an application-managed hash chain with integrity checks, not a public or decentralized blockchain or an independently immutable record.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setPaid(false); setReceiptData(null); }} style={{ flex: 1, padding: '10px', background: '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                Make Another Transaction
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