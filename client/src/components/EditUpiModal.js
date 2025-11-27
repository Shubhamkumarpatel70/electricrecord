import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function EditUpiModal({ open, onClose, user, onUpdated }) {
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user) {
      setUpiId(user.upiId || '');
      setError('');
    }
  }, [open, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (upiId && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
      setError('Invalid UPI ID format. Example: yourname@paytm');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put(`/api/admin/users/${user._id}/upi`, { upiId: upiId.trim() });
      onUpdated(data.data.user);
      onClose();
      toast.success('UPI ID updated successfully!');
    } catch (err) {
      console.error('Error updating UPI ID:', err);
      setError(err.response?.data?.message || 'Failed to update UPI ID');
      toast.error(err.response?.data?.message || 'Failed to update UPI ID');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !user) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content entry-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>💳 Edit UPI ID</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="entry-form">
          <div className="form-group">
            <label>User Information</label>
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '12px', 
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <p style={{ margin: '4px 0' }}><strong>Name:</strong> {user.name}</p>
              <p style={{ margin: '4px 0' }}><strong>Email:</strong> {user.email}</p>
              <p style={{ margin: '4px 0' }}><strong>Meter:</strong> {user.meterNumber}</p>
            </div>
          </div>

          <div className="form-group">
            <label>UPI ID</label>
            <div className="input-wrapper">
              <span className="input-icon">💳</span>
              <input
                type="text"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  setError('');
                }}
                placeholder="e.g., yourname@paytm, yourname@ybl, yourname@okaxis"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', marginLeft: '40px' }}>
              Leave empty to remove UPI ID. Format: yourname@paytm
            </div>
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
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="btn-icon">💾</span>
                  Save UPI ID
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

