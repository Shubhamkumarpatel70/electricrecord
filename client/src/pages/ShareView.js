import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ShareView() {
  const { token } = useParams();
  const [phone, setPhone] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedPayment, setExpandedPayment] = useState(null); // Track which record has payment form expanded
  const [paymentScreenshots, setPaymentScreenshots] = useState({}); // Store screenshots for each record
  const [paymentLoading, setPaymentLoading] = useState({}); // Track loading state for each record
  const [imageModal, setImageModal] = useState({ open: false, imageUrl: '' });

  useEffect(() => {
    console.log('ShareView mounted with token:', token);
    if (!token) {
      setError('Invalid share link. No token provided.');
    }
  }, [token]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Use direct fetch for public route (no auth token needed)
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? (process.env.REACT_APP_API_URL || '') 
        : 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/customers/share/${token}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phone.trim() })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to verify phone number');
      }

      setData(responseData);
      toast.success('Phone verified successfully!');
    } catch (err) {
      console.error('Error verifying phone:', err);
      const errorMsg = err.message || 'Failed to verify phone number';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="auth-card" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="auth-header">
            <div className="auth-logo">⚡</div>
            <h1>Invalid Share Link</h1>
            <p>The share link is invalid or missing a token.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="auth-card" style={{ maxWidth: '800px', width: '100%' }}>
        <div className="auth-header">
          <div className="auth-logo">⚡</div>
          <h1>View Electricity Records</h1>
          <p>Enter your phone number to access your records</p>
        </div>

        {!data ? (
          <>
            <form onSubmit={handleVerify} className="auth-form">
              <div className="input-wrapper">
                <span className="input-icon">📞</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your mobile number"
                  required
                  disabled={loading}
                  style={{ fontSize: '16px' }}
                  autoFocus
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Verifying...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🔓</span>
                    Access Records
                  </>
                )}
              </button>
            </form>
            <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', fontSize: '13px', color: '#0369a1' }}>
              <strong>Note:</strong> Enter the mobile number that was registered when this account was created.
            </div>
          </>
        ) : (
          <div style={{ width: '100%' }}>
            <div style={{ marginBottom: '24px', background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ marginBottom: '12px' }}>Customer Information</h2>
              <div style={{ display: 'grid', gap: '8px' }}>
                <p><strong>Name:</strong> {data.customer.name}</p>
                <p><strong>Meter Number:</strong> {data.customer.meterNumber}</p>
                <p><strong>Phone:</strong> {data.customer.phone}</p>
                {data.customer.email && <p><strong>Email:</strong> {data.customer.email}</p>}
                <p><strong>Address:</strong> {data.customer.address}</p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ marginBottom: '12px' }}>
                Current Month ({new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Units</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    {data.currentMonth.units}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Previous Month</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {data.currentMonth.previousUnits}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Amount</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    ₹{data.currentMonth.amount.toFixed(2)}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Records</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {data.currentMonth.records}
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
                    ₹{data.currentMonth.paid.toFixed(2)}
                  </div>
                </div>
                <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '8px', border: '2px solid #ef4444' }}>
                  <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>Unpaid Amount</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#991b1b', marginBottom: '8px' }}>
                    ₹{data.currentMonth.unpaid.toFixed(2)}
                  </div>
                  {data.currentMonth.unpaid > 0 && (
                    <button
                      onClick={() => {
                        // Find first unpaid record and expand it
                        const firstUnpaid = data.records.find((r, idx) => r.paymentStatus !== 'paid');
                        if (firstUnpaid) {
                          const unpaidId = firstUnpaid._id || `record-${data.records.indexOf(firstUnpaid)}`;
                          setExpandedPayment(unpaidId);
                          // Scroll to records section
                          setTimeout(() => {
                            document.querySelector('.table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        }
                      }}
                      className="auth-submit"
                      style={{ 
                        width: '100%',
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginTop: '8px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        color: 'white',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      💳 Pay Now
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ marginBottom: '12px' }}>Overall Summary</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '12px'
              }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Amount</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    ₹{data.total.amount.toFixed(2)}
                  </div>
                </div>
                <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#047857', marginBottom: '4px' }}>Total Paid</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#047857' }}>
                    ₹{data.total.paid.toFixed(2)}
                  </div>
                </div>
                <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>Total Unpaid</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#991b1b', marginBottom: '8px' }}>
                    ₹{data.total.unpaid.toFixed(2)}
                  </div>
                  {data.total.unpaid > 0 && (
                    <button
                      onClick={() => {
                        // Find first unpaid record and expand it
                        const firstUnpaid = data.records.find((r, idx) => r.paymentStatus !== 'paid');
                        if (firstUnpaid) {
                          const unpaidId = firstUnpaid._id || `record-${data.records.indexOf(firstUnpaid)}`;
                          setExpandedPayment(unpaidId);
                          // Scroll to records section
                          setTimeout(() => {
                            document.querySelector('.table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        }
                      }}
                      className="auth-submit"
                      style={{ 
                        width: '100%',
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginTop: '8px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        color: 'white',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      💳 Pay Now
                    </button>
                  )}
                </div>
              </div>
              <div style={{ marginTop: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Total Records: {data.total.records}
              </div>
            </div>

            {data.records && data.records.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ margin: 0 }}>All Records</h2>
                  {data.records.some(r => {
                    const status = r.paymentStatus || 'pending';
                    return status.toLowerCase() !== 'paid';
                  }) && (
                    <button
                      onClick={() => {
                        // Find first unpaid record and expand it
                        const firstUnpaid = data.records.find((r) => {
                          const status = r.paymentStatus || 'pending';
                          return status.toLowerCase() !== 'paid';
                        });
                        if (firstUnpaid) {
                          const unpaidId = firstUnpaid._id || `record-${data.records.indexOf(firstUnpaid)}`;
                          setExpandedPayment(unpaidId);
                          // Scroll to the expanded payment form
                          setTimeout(() => {
                            const expandedRow = document.querySelector(`[data-record-id="${unpaidId}"]`);
                            if (expandedRow) {
                              expandedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            } else {
                              document.querySelector('.table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }
                      }}
                      className="auth-submit"
                      style={{ 
                        padding: '12px 24px',
                        fontSize: '15px',
                        fontWeight: '600',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        border: 'none',
                        whiteSpace: 'nowrap',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>💳</span>
                      <span>Pay Now</span>
                    </button>
                  )}
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Previous</th>
                        <th>Current</th>
                        <th>Units</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th style={{ minWidth: '120px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.records.map((r, idx) => {
                        const recordId = r._id || `record-${idx}`;
                        const isExpanded = expandedPayment === recordId;
                        const screenshot = paymentScreenshots[recordId];
                        const isLoading = paymentLoading[recordId];
                        // Check if record is paid - show Pay Now button for any non-paid status
                        const paymentStatus = r.paymentStatus || 'pending';
                        const isPaid = paymentStatus.toLowerCase() === 'paid';
                        const showPayButton = !isPaid; // Show button for all non-paid records
                        
                        // Debug log
                        if (idx === 0) {
                          console.log('First record payment status:', paymentStatus, 'isPaid:', isPaid, 'showPayButton:', showPayButton);
                        }
                        
                        return (
                          <React.Fragment key={recordId}>
                            <tr className="record-row">
                              <td>{new Date(r.date).toLocaleDateString()}</td>
                              <td>{r.previousReading}</td>
                              <td>{r.currentReading}</td>
                              <td>
                                <span className="units-badge">{r.unitsConsumed} units</span>
                              </td>
                              <td>
                                <span className="amount-badge">₹{r.totalAmount?.toFixed(2) || '0.00'}</span>
                              </td>
                              <td>
                                <span className={`status-badge status-${paymentStatus}`}>
                                  {paymentStatus}
                                </span>
                              </td>
                              <td>
                                {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-'}
                              </td>
                              <td style={{ minWidth: '150px', textAlign: 'center' }}>
                                <div style={{ 
                                  display: 'flex', 
                                  gap: '8px', 
                                  flexWrap: 'wrap', 
                                  justifyContent: 'center', 
                                  alignItems: 'center', 
                                  minHeight: '40px',
                                  width: '100%'
                                }}>
                                  {showPayButton ? (
                                    <button
                                      onClick={() => {
                                        console.log('Pay Now clicked for record:', recordId, 'Current expanded:', expandedPayment);
                                        setExpandedPayment(isExpanded ? null : recordId);
                                      }}
                                      className="auth-submit"
                                      style={{ 
                                        padding: '10px 18px', 
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                        border: 'none',
                                        whiteSpace: 'nowrap',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: 'white',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        minWidth: '120px',
                                        justifyContent: 'center'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.transform = 'scale(1.05)';
                                        e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                                        e.target.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.transform = 'scale(1)';
                                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                        e.target.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                      }}
                                    >
                                      {isExpanded ? (
                                        <>
                                          <span>❌</span>
                                          <span>Close</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>💳</span>
                                          <span>Pay Now</span>
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <span style={{ 
                                      padding: '8px 16px',
                                      background: '#d1fae5',
                                      color: '#047857',
                                      borderRadius: '6px',
                                      fontSize: '13px',
                                      fontWeight: '600',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      ✅ Paid
                                    </span>
                                  )}
                                  {r.paymentScreenshot && (
                                    <button
                                      onClick={() => setImageModal({ open: true, imageUrl: r.paymentScreenshot })}
                                      className="secondary"
                                      style={{ 
                                        padding: '8px 16px', 
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        borderRadius: '8px',
                                        border: 'none',
                                        whiteSpace: 'nowrap',
                                        background: '#e2e8f0',
                                        color: '#1e293b',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      👁️ View Payment
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && showPayButton && (
                              <tr data-record-id={recordId}>
                                <td colSpan="8" style={{ padding: '20px', background: 'var(--bg-secondary)', borderTop: 'none' }}>
                                  <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                                    <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>💳 Payment Options</h3>
                                    
                                    <div style={{ marginBottom: '20px' }}>
                                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Amount to Pay</label>
                                      <div style={{
                                        padding: '12px',
                                        background: 'white',
                                        borderRadius: '8px',
                                        border: '2px solid var(--border-color)',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        color: 'var(--primary-color)',
                                        textAlign: 'center'
                                      }}>
                                        ₹{r.totalAmount?.toFixed(2) || '0.00'}
                                      </div>
                                    </div>

                                    {data?.user?.upiId ? (
                                      <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>UPI ID for Payment</label>
                                        <div style={{
                                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                          padding: '20px',
                                          borderRadius: '12px',
                                          textAlign: 'center',
                                          color: 'white',
                                          marginBottom: '10px'
                                        }}>
                                          <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>Send payment to:</div>
                                          <div style={{ fontSize: '24px', fontWeight: 'bold', wordBreak: 'break-all', marginBottom: '12px' }}>
                                            {data.user.upiId}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              navigator.clipboard.writeText(data.user.upiId);
                                              toast.success('UPI ID copied to clipboard!');
                                            }}
                                            style={{
                                              padding: '8px 16px',
                                              background: 'rgba(255, 255, 255, 0.2)',
                                              border: '1px solid rgba(255, 255, 255, 0.3)',
                                              borderRadius: '8px',
                                              color: 'white',
                                              cursor: 'pointer',
                                              fontSize: '14px',
                                              fontWeight: '500'
                                            }}
                                          >
                                            📋 Copy UPI ID
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{
                                        padding: '15px',
                                        background: '#fef3c7',
                                        borderRadius: '8px',
                                        marginBottom: '20px',
                                        border: '1px solid #fbbf24'
                                      }}>
                                        <div style={{ color: '#92400e', fontSize: '14px' }}>
                                          ⚠️ UPI ID not configured. Please contact the biller for payment details.
                                        </div>
                                      </div>
                                    )}

                                    <form onSubmit={async (e) => {
                                      e.preventDefault();
                                      const fileInput = e.target.querySelector('input[type="file"]');
                                      const file = fileInput?.files?.[0];
                                      
                                      if (!file) {
                                        toast.error('Please upload payment screenshot');
                                        return;
                                      }

                                        setPaymentLoading({ ...paymentLoading, [recordId]: true });
                                      try {
                                        const formData = new FormData();
                                        formData.append('paymentScreenshot', file);

                                        const apiUrl = process.env.NODE_ENV === 'production' 
                                          ? (process.env.REACT_APP_API_URL || '') 
                                          : 'http://localhost:5000';
                                        const response = await fetch(`${apiUrl}/api/records/${recordId}/submit-payment`, {
                                          method: 'POST',
                                          body: formData
                                        });

                                        const responseData = await response.json();

                                        if (!response.ok) {
                                          throw new Error(responseData.message || 'Failed to submit payment');
                                        }

                                        toast.success('Payment screenshot submitted successfully! Payment will be verified soon.');
                                        
                                        // Update the record in the data
                                        const updatedRecords = data.records.map((record, recordIdx) => {
                                          const recId = record._id || `record-${recordIdx}`;
                                          return recId === recordId
                                            ? { ...record, paymentScreenshot: responseData.record.paymentScreenshot, paymentSubmittedAt: responseData.record.paymentSubmittedAt }
                                            : record;
                                        });
                                        setData({ ...data, records: updatedRecords });
                                        
                                        setExpandedPayment(null);
                                        setPaymentScreenshots({ ...paymentScreenshots, [recordId]: null });
                                        fileInput.value = '';
                                      } catch (err) {
                                        console.error('Error submitting payment:', err);
                                        toast.error(err.message || 'Failed to submit payment');
                                      } finally {
                                        setPaymentLoading({ ...paymentLoading, [recordId]: false });
                                      }
                                    }}>
                                      <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Upload Payment Screenshot</label>
                                        <div className="file-input-wrapper">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files[0];
                                              if (file) {
                                                if (file.size > 5 * 1024 * 1024) {
                                                  toast.error('Image size should be less than 5MB');
                                                  return;
                                                }
                                                setPaymentScreenshots({ ...paymentScreenshots, [recordId]: file });
                                              }
                                            }}
                                            id={`payment-screenshot-${recordId}`}
                                            className="file-input"
                                            required
                                          />
                                          <label htmlFor={`payment-screenshot-${r._id}`} className="file-input-label">
                                            <span className="file-icon">📷</span>
                                            <span className="file-text">
                                              {screenshot ? screenshot.name : 'Choose payment screenshot'}
                                            </span>
                                          </label>
                                        </div>
                                        {screenshot && (
                                          <div style={{ marginTop: '12px' }}>
                                            <img
                                              src={URL.createObjectURL(screenshot)}
                                              alt="Payment screenshot preview"
                                              style={{
                                                maxWidth: '100%',
                                                maxHeight: '300px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)'
                                              }}
                                            />
                                          </div>
                                        )}
                                      </div>

                                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                        <button
                                          type="button"
                                          className="secondary"
                                          onClick={() => {
                                            setExpandedPayment(null);
                                            setPaymentScreenshots({ ...paymentScreenshots, [recordId]: null });
                                          }}
                                          disabled={isLoading}
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="submit"
                                          className="auth-submit"
                                          disabled={isLoading || !screenshot}
                                        >
                                          {isLoading ? (
                                            <>
                                              <span className="spinner-small"></span>
                                              Submitting...
                                            </>
                                          ) : (
                                            <>
                                              <span className="btn-icon">💳</span>
                                              Submit Payment
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </form>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {imageModal.open && (
              <div className="modal" onClick={() => setImageModal({ open: false, imageUrl: '' })}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90vh' }}>
                  <div className="modal-header">
                    <h3>Payment Screenshot</h3>
                    <button className="close-btn" onClick={() => setImageModal({ open: false, imageUrl: '' })}>×</button>
                  </div>
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <img
                      src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imageModal.imageUrl}`}
                      alt="Payment screenshot"
                      style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={() => {
                setData(null);
                setPhone('');
                setError('');
              }}
              className="secondary"
              style={{ width: '100%' }}
            >
              View Another Record
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

