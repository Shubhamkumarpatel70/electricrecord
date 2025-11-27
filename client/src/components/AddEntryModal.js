import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function AddEntryModal({ open, onClose, onCreated, customers = [] }) {
  const [previous, setPrevious] = useState('');
  const [current, setCurrent] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('8');
  const [dueDate, setDueDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPreviousRecord, setHasPreviousRecord] = useState(false);

  useEffect(() => {
    if (open) {
      setError('');
      setLoading(true);
      setPrevious('');
      setCurrent('');
      setHasPreviousRecord(false);
      const url = selectedCustomer 
        ? `/api/records/last?customerId=${selectedCustomer}`
        : '/api/records/last';
      api.get(url)
        .then(({ data }) => {
          if (data && data.currentReading) {
            setPrevious(data.currentReading.toString());
            setHasPreviousRecord(true);
          } else {
            setPrevious('');
            setHasPreviousRecord(false);
          }
        })
        .catch((err) => {
          console.error('Error fetching last record:', err);
          setPrevious('');
          setHasPreviousRecord(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, selectedCustomer]);

  const validateForm = () => {
    if (!previous || previous === '' || Number(previous) < 0) {
      setError('Previous reading is required and must be 0 or greater');
      return false;
    }
    if (!current || current === '' || Number(current) <= 0) {
      setError('Current reading must be greater than 0');
      return false;
    }
    if (Number(current) <= Number(previous)) {
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
      form.append('previousReading', previous); // Send previous reading manually
      form.append('ratePerUnit', ratePerUnit);
      form.append('dueDate', dueDate);
      form.append('remarks', remarks);
      form.append('paymentStatus', paymentStatus);
      if (selectedCustomer) form.append('customerId', selectedCustomer);
      if (file) form.append('billImage', file);
      
      console.log('Submitting form data:', {
        currentReading: current,
        ratePerUnit,
        dueDate,
        remarks,
        hasFile: !!file
      });

      const { data } = await api.post('/api/records', form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      console.log('Record created successfully:', data);
      onCreated(data);
      onClose();
      setPrevious('');
      setCurrent(''); 
      setDueDate(''); 
      setRemarks(''); 
      setFile(null);
      setPaymentStatus('pending');
      setSelectedCustomer('');
      setHasPreviousRecord(false);
      toast.success('Entry created successfully!');
    } catch (err) {
      console.error('Error creating record:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create record';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content entry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📊 Add New Electricity Entry</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={submit} className="entry-form">
          {customers.length > 0 && (
            <div className="form-group">
              <label>Customer (Optional - Leave empty for self)</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <select
                  value={selectedCustomer}
                  onChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    setPrevious('');
                    setHasPreviousRecord(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="">Self</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.meterNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>Previous Reading {hasPreviousRecord && '(Auto-filled - You can edit)'}</label>
              <div className="input-wrapper">
                <span className="input-icon">🔢</span>
                <input 
                  type="number"
                  value={previous} 
                  onChange={(e) => setPrevious(e.target.value)}
                  className={hasPreviousRecord ? '' : ''}
                  placeholder="Enter previous reading"
                  min="0"
                  required
                />
              </div>
              {hasPreviousRecord && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Auto-filled from last record. You can edit if needed.
                </div>
              )}
              {!hasPreviousRecord && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  No previous record found. Please enter manually.
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Current Reading</label>
              <div className="input-wrapper">
                <span className="input-icon">📈</span>
                <input 
                  type="number" 
                  value={current} 
                  onChange={(e) => {
                    setCurrent(e.target.value);
                    setError(''); // Clear error when user types
                  }} 
                  required 
                  min={previous ? Number(previous) + 1 : undefined}
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
                id="bill-image"
                className="file-input"
              />
              <label htmlFor="bill-image" className="file-input-label">
                <span className="file-icon">📷</span>
                <span className="file-text">
                  {file ? file.name : 'Choose bill image'}
                </span>
              </label>
            </div>
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

          <div className="form-group">
            <label>Payment Status</label>
            <div className="payment-status-buttons">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`payment-status-btn paid ${paymentStatus === 'paid' ? 'active' : ''}`}
              >
                <span>✅</span>
                Paid
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('pending')}
                className={`payment-status-btn pending ${paymentStatus === 'pending' ? 'active' : ''}`}
              >
                <span>⏳</span>
                Unpaid
              </button>
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
                  Save Entry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 