import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function EditEntryModal({ open, onClose, record, onUpdated }) {
  const [current, setCurrent] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && record) {
      setCurrent(record.currentReading?.toString() || '');
      setRatePerUnit(record.ratePerUnit?.toString() || '8');
      setDueDate(record.dueDate ? new Date(record.dueDate).toISOString().split('T')[0] : '');
      setRemarks(record.remarks || '');
      setFile(null);
      setError('');
    }
  }, [open, record]);

  const validateForm = () => {
    if (!current || current <= 0) {
      setError('Current reading must be greater than 0');
      return false;
    }
    if (Number(current) <= Number(record.previousReading)) {
      setError('Current reading must be greater than previous reading');
      return false;
    }
    if (!dueDate) {
      setError('Due date is required');
      return false;
    }
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('currentReading', current);
      form.append('ratePerUnit', ratePerUnit);
      form.append('dueDate', dueDate);
      form.append('remarks', remarks);
      if (file) form.append('billImage', file);
      
      const { data } = await api.put(`/api/records/${record._id}`, form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      onUpdated(data);
      onClose();
      toast.success('Entry updated successfully!');
    } catch (err) {
      console.error('Error updating record:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update record';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !record) return null;
  
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content entry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Edit Electricity Entry</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={submit} className="entry-form">
          <div className="form-row">
            <div className="form-group">
              <label>Previous Reading</label>
              <div className="input-wrapper">
                <span className="input-icon">🔢</span>
                <input 
                  value={record.previousReading} 
                  disabled 
                  className="disabled-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Current Reading</label>
              <div className="input-wrapper">
                <span className="input-icon">📈</span>
                <input 
                  type="number" 
                  value={current} 
                  onChange={(e) => setCurrent(e.target.value)} 
                  required 
                  min={record.previousReading + 1}
                  placeholder="Enter current reading"
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Rate Per Unit (₹)</label>
              <div className="input-wrapper">
                <span className="input-icon">💰</span>
                <input 
                  type="number" 
                  step="0.01" 
                  value={ratePerUnit} 
                  onChange={(e) => setRatePerUnit(e.target.value)} 
                  placeholder="8.00"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <div className="input-wrapper">
                <span className="input-icon">📅</span>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Bill Image</label>
            <div className="file-input-wrapper">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setFile(e.target.files[0])}
                id="edit-bill-image"
                className="file-input"
              />
              <label htmlFor="edit-bill-image" className="file-input-label">
                <span className="file-icon">📷</span>
                <span className="file-text">
                  {file ? file.name : (record.billImage ? 'Change bill image' : 'Choose bill image')}
                </span>
              </label>
            </div>
            {record.billImage && !file && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                Current: <a href={record.billImage} target="_blank" rel="noopener noreferrer">View current image</a>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Remarks (Optional)</label>
            <div className="input-wrapper">
              <span className="input-icon">💬</span>
              <input 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
                placeholder="Any additional notes..."
              />
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
                  Updating...
                </>
              ) : (
                <>
                  <span className="btn-icon">💾</span>
                  Update Entry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

