import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ShareCustomerModal({ open, onClose, customer }) {
  const [summary, setSummary] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    if (open && customer) {
      fetchSummary();
      generateShareLink();
    } else {
      setShareLink('');
      setSummary(null);
    }
  }, [open, customer]);

  const generateShareLink = async () => {
    if (!customer) return;
    setLinkLoading(true);
    try {
      const { data } = await api.post(`/api/customers/${customer._id}/share-link`);
      setShareLink(data.shareLink);
    } catch (err) {
      console.error('Error generating share link:', err);
      toast.error('Failed to generate share link');
    } finally {
      setLinkLoading(false);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/customers/${customer._id}/summary`);
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
      toast.error('Failed to load customer summary');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;
    
    const text = `
Customer Electricity Bill Summary
================================

Customer: ${summary.customer.name}
Meter Number: ${summary.customer.meterNumber}
Phone: ${summary.customer.phone}
${summary.customer.email ? `Email: ${summary.customer.email}` : ''}
Address: ${summary.customer.address}

Current Month (${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
--------------------------------
Total Units: ${summary.currentMonth.units}
Previous Month Units: ${summary.currentMonth.previousUnits}
Total Amount: ₹${summary.currentMonth.amount.toFixed(2)}
Paid Amount: ₹${summary.currentMonth.paid.toFixed(2)}
Unpaid Amount: ₹${summary.currentMonth.unpaid.toFixed(2)}
Records: ${summary.currentMonth.records}

Overall Summary
--------------------------------
Total Amount: ₹${summary.total.amount.toFixed(2)}
Total Paid: ₹${summary.total.paid.toFixed(2)}
Total Unpaid: ₹${summary.total.unpaid.toFixed(2)}
Total Records: ${summary.total.records}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      toast.success('Summary copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  if (!open || !customer) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content entry-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>📤 Share Customer Summary</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body" style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '16px' }}>Loading summary...</p>
            </div>
          ) : summary ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Customer Information</h4>
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                  <p><strong>Name:</strong> {summary.customer.name}</p>
                  <p><strong>Meter Number:</strong> {summary.customer.meterNumber}</p>
                  <p><strong>Phone:</strong> {summary.customer.phone}</p>
                  {summary.customer.email && <p><strong>Email:</strong> {summary.customer.email}</p>}
                  <p><strong>Address:</strong> {summary.customer.address}</p>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Current Month ({new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Units</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      {summary.currentMonth.units}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Previous Month</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {summary.currentMonth.previousUnits}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Amount</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      ₹{summary.currentMonth.amount.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Records</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {summary.currentMonth.records}
                    </div>
                  </div>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '12px'
                }}>
                  <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '8px', border: '2px solid #10b981' }}>
                    <div style={{ fontSize: '12px', color: '#047857', marginBottom: '4px' }}>Paid Amount</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#047857' }}>
                      ₹{summary.currentMonth.paid.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '8px', border: '2px solid #ef4444' }}>
                    <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>Unpaid Amount</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#991b1b' }}>
                      ₹{summary.currentMonth.unpaid.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Overall Summary</h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '12px'
                }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Amount</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      ₹{summary.total.amount.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#047857', marginBottom: '4px' }}>Total Paid</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#047857' }}>
                      ₹{summary.total.paid.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>Total Unpaid</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#991b1b' }}>
                      ₹{summary.total.unpaid.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Total Records: {summary.total.records}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>No summary data available</p>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ flexDirection: 'column', gap: '12px' }}>
          {linkLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Generating share link...</p>
            </div>
          ) : shareLink && (
            <div style={{ width: '100%', marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Share Link:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: '#f8f9fa'
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink).then(() => {
                      toast.success('Share link copied to clipboard!');
                    }).catch(() => {
                      toast.error('Failed to copy link');
                    });
                  }}
                  className="auth-submit"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <span className="btn-icon">📋</span>
                  Copy Link
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                Share this link with the customer. They will need to enter their phone number to view records.
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button className="secondary" onClick={onClose} style={{ flex: 1 }}>
              Close
            </button>
            {summary && (
              <button onClick={copyToClipboard} className="auth-submit" style={{ flex: 1 }}>
                <span className="btn-icon">📋</span>
                Copy Summary
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

