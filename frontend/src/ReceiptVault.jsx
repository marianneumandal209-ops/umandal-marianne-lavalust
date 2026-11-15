import React, { useState, useEffect } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';

export default function ReceiptVault() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [ledgerIntegrity, setLedgerIntegrity] = useState(null);

  useEffect(() => {
    api.get('/get_transactions/1')
      .then(response => {
        if (response.data.status === 'success') {
          setLedgerIntegrity(response.data.ledger);
          // I-map ang database keys para tumugma sa frontend variables
          const formattedReceipts = response.data.data.map(item => ({
            id: item.id,
            eOrNumber: item.e_or_number,
            trxCode: `TRX-${item.id}-OMP`,
            taxType: item.tax_type,
            amount: item.amount,
            paymentMethod: item.payment_method,
            timestamp: item.created_at,
            blockHash: item.block_hash,
            ledgerStatus: item.ledger_status,
            ledgerIndex: item.ledger_index,
            previousHash: item.previous_hash,
          }));
          setReceipts(formattedReceipts);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching receipts from database:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F0FDF4', fontFamily: 'sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ 
        background: '#FFFFFF', 
        padding: '16px 32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
        borderBottom: '1px solid #DCFCE7' 
      }}>
        <h2 style={{ color: '#166534', margin: 0, fontSize: '20px', fontWeight: '700' }}>
          🧾 Transaction Receipts - Digital Ledger
        </h2>
        
        <button 
          onClick={() => navigate('/taxpayer')} 
          style={{ 
            padding: '8px 16px', 
            background: '#FFFFFF', 
            color: '#16A34A', 
            border: '2px solid #16A34A', 
            borderRadius: '6px', 
            fontWeight: '600', 
            cursor: 'pointer', 
            fontSize: '13px' 
          }}
        >
          Back to Dashboard
        </button>
      </header>

      {/* Main Content Area */}
      <main style={{ padding: '24px 32px', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ background: '#FFFFFF', padding: '24px 30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #DCFCE7', marginBottom: '24px' }}>
          <h3 style={{ color: '#166534', marginTop: 0, fontSize: '18px' }}>Payment Transaction Records</h3>
          <p style={{ color: '#4B5563', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
            Each new receipt is recorded in an application-managed digital ledger. Its SHA-256 hash links to the previous entry, and the backend verifies the chain when receipts are loaded. This is not a public or decentralized blockchain, nor an independently immutable record.
          </p>
          {ledgerIntegrity && (
            <p role="status" style={{ color: ledgerIntegrity.valid ? '#166534' : '#B91C1C', fontWeight: '600', fontSize: '13px', margin: '12px 0 0' }}>
              Ledger integrity: {ledgerIntegrity.valid ? `verified (${ledgerIntegrity.entry_count} entries)` : 'verification failed'}
            </p>
          )}
        </div>

        {/* Loading State or Receipts Table / List */}
        {loading ? (
          <div style={{ background: '#FFFFFF', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#0D9488', fontWeight: 'bold', border: '1px solid #DCFCE7' }}>
            Loading e-OR records from Aiven Cloud database...
          </div>
        ) : receipts.length === 0 ? (
          <div style={{ background: '#FFFFFF', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#6B7280', border: '1px solid #DCFCE7' }}>
            Wala pang nakitang transaksyon o resibo sa database.
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #DCFCE7', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#F0FDF4', borderBottom: '1px solid #DCFCE7', color: '#166534' }}>
                  <th style={{ padding: '14px 20px' }}>Receipt Reference</th>
                  <th style={{ padding: '14px 20px' }}>Tax Type</th>
                  <th style={{ padding: '14px 20px' }}>Amount</th>
                  <th style={{ padding: '14px 20px' }}>Ledger</th>
                  <th style={{ padding: '14px 20px' }}>Timestamp</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 20px', fontWeight: '600', color: '#1F2937' }}>{rec.eOrNumber}</td>
                    <td style={{ padding: '14px 20px', color: '#4B5563' }}>{rec.taxType}</td>
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: '#166534' }}>₱{rec.amount}</td>
                    <td style={{ padding: '14px 20px', color: rec.ledgerStatus === 'verified' ? '#166534' : rec.ledgerStatus === 'invalid' ? '#B91C1C' : '#6B7280' }}>
                      {rec.ledgerStatus === 'verified' ? `Verified #${rec.ledgerIndex}` : rec.ledgerStatus === 'invalid' ? 'Integrity check failed' : 'Legacy entry'}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#6B7280', fontSize: '13px' }}>{rec.timestamp}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <button 
                        onClick={() => setSelectedReceipt(rec)}
                        style={{ 
                          padding: '6px 12px', 
                          background: '#16A34A', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px', 
                          fontWeight: '600', 
                          cursor: 'pointer', 
                          fontSize: '12px' 
                        }}
                      >
                        View e-OR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal / Details view for selected receipt */}
        {selectedReceipt && (
          <div style={{ marginTop: '24px', background: '#FFFFFF', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', border: '2px solid #16A34A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#166534', margin: 0, fontSize: '18px' }}>📄 Transaction Receipt</h3>
              <button onClick={() => setSelectedReceipt(null)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#6B7280', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <p style={{ margin: 0 }}><strong>e-OR Number:</strong> {selectedReceipt.eOrNumber}</p>
              <p style={{ margin: 0 }}><strong>Transaction Code:</strong> {selectedReceipt.trxCode}</p>
              <p style={{ margin: 0 }}><strong>Tax Type:</strong> {selectedReceipt.taxType}</p>
              <p style={{ margin: 0 }}><strong>Amount Paid:</strong> ₱{selectedReceipt.amount}</p>
              <p style={{ margin: 0 }}><strong>Method:</strong> {selectedReceipt.paymentMethod}</p>
              <p style={{ margin: 0 }}><strong>Timestamp:</strong> {selectedReceipt.timestamp}</p>
            </div>

            <div style={{ marginTop: '16px', background: '#064E3B', color: '#E6FFFA', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
              <p style={{ margin: '0 0 6px 0', color: '#FCD34D', fontWeight: 'bold' }}>DIGITAL LEDGER {selectedReceipt.ledgerStatus === 'verified' ? `ENTRY #${selectedReceipt.ledgerIndex} — VERIFIED` : selectedReceipt.ledgerStatus === 'invalid' ? 'INTEGRITY CHECK FAILED' : 'LEGACY ENTRY — NOT LEDGER-VERIFIED'}:</p>
              {selectedReceipt.previousHash && <p style={{ margin: '0 0 6px 0', wordBreak: 'break-all' }}>Previous entry hash: {selectedReceipt.previousHash}</p>}
              <p style={{ margin: 0, wordBreak: 'break-all' }}>{selectedReceipt.blockHash || 'No hash value was saved for this transaction.'}</p>
              <p style={{ margin: '8px 0 0', fontFamily: 'sans-serif', fontSize: '11px' }}>Application-managed hash chain; not a public blockchain or independently immutable record.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}