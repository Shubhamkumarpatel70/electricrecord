import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function PaymentModal({ open, onClose, record, upiId, onPaymentSubmitted }) {
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open || !record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!screenshot) {
      setError('Please upload payment screenshot');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('paymentScreenshot', screenshot);

      const apiUrl = process.env.NODE_ENV === 'production' 
        ? (process.env.REACT_APP_API_URL || '') 
        : 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/records/${record._id}/submit-payment`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit payment');
      }

      toast.success('Payment screenshot submitted successfully! Payment will be verified soon.');
      onPaymentSubmitted(data.record);
      onClose();
      setScreenshot(null);
    } catch (err) {
      console.error('Error submitting payment:', err);
      setError(err.message || 'Failed to submit payment');
      toast.error(err.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  const previewImage = screenshot ? URL.createObjectURL(screenshot) : null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content entry-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>💳 Pay Now</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="entry-form">
          <div className="form-group">
            <label>Amount to Pay</label>
            <div className="input-wrapper">
              <span className="input-icon">₹</span>
              <input
                type="text"
                value={`₹${record.totalAmount?.toFixed(2) || '0.00'}`}
                readOnly
                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          {upiId && (
            <div className="form-group">
              <label>UPI ID for Payment</label>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center',
                color: 'white',
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>Send payment to:</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', wordBreak: 'break-all' }}>
                  {upiId}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(upiId);
                    toast.success('UPI ID copied to clipboard!');
                  }}
                  style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  📋 Copy UPI ID
                </button>
              </div>
            </div>
          )}

          {!upiId && (
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

          <div className="form-group">
            <label>Upload Payment Screenshot</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setError('Image size should be less than 5MB');
                      return;
                    }
                    setScreenshot(file);
                    setError('');
                  }
                }}
                id="payment-screenshot"
                className="file-input"
                required
              />
              <label htmlFor="payment-screenshot" className="file-input-label">
                <span className="file-icon">📷</span>
                <span className="file-text">
                  {screenshot ? screenshot.name : 'Choose payment screenshot'}
                </span>
              </label>
            </div>
            {previewImage && (
              <div style={{ marginTop: '12px' }}>
                <img
                  src={previewImage}
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

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="auth-submit" disabled={loading || !screenshot}>
              {loading ? (
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
    </div>
  );
}

