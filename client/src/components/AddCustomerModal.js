import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function AddCustomerModal({ open, onClose, onCreated, customer }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      if (customer) {
        setName(customer.name || '');
        setEmail(customer.email || '');
        setPhone(customer.phone || '');
        setMeterNumber(customer.meterNumber || '');
        setAddress(customer.address || '');
      } else {
        setName('');
        setEmail('');
        setPhone('');
        setMeterNumber('');
        setAddress('');
      }
      setError('');
    }
  }, [open, customer]);

  const validateForm = () => {
    if (!name || name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }
    if (!phone || !/^[\+]?[1-9][\d]{7,15}$/.test(phone)) {
      setError('Please enter a valid phone number');
      return false;
    }
    if (!meterNumber || !/^[A-Z0-9]{6,12}$/.test(meterNumber.toUpperCase())) {
      setError('Meter number must be 6-12 alphanumeric characters');
      return false;
    }
    if (!address || address.trim().length < 10) {
      setError('Address must be at least 10 characters');
      return false;
    }
    if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      setError('Please enter a valid email address');
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
      const data = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        meterNumber: meterNumber.toUpperCase().trim(),
        address: address.trim()
      };

      let response;
      if (customer) {
        response = await api.put(`/api/customers/${customer._id}`, data);
        toast.success('Customer updated successfully!');
      } else {
        response = await api.post('/api/customers', data);
        toast.success('Customer added successfully!');
      }
      
      onCreated(response.data);
      onClose();
    } catch (err) {
      console.error('Error saving customer:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save customer';
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
          <h3>{customer ? '✏️ Edit Customer' : '➕ Add New Customer'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={submit} className="entry-form">
          <div className="form-group">
            <label>Customer Name *</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="Enter customer name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number *</label>
              <div className="input-wrapper">
                <span className="input-icon">📞</span>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required 
                  placeholder="1234567890"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email (Optional)</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="customer@example.com"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Meter Number *</label>
            <div className="input-wrapper">
              <span className="input-icon">🔢</span>
              <input 
                type="text" 
                value={meterNumber} 
                onChange={(e) => setMeterNumber(e.target.value.toUpperCase())} 
                required 
                placeholder="ABC123456"
                maxLength={12}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address *</label>
            <div className="input-wrapper">
              <span className="input-icon">📍</span>
              <textarea 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                required 
                placeholder="Enter full address"
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
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
                  {customer ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <span className="btn-icon">{customer ? '💾' : '➕'}</span>
                  {customer ? 'Update Customer' : 'Add Customer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

