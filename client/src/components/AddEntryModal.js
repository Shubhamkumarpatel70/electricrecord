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
  const [filePreview, setFilePreview] = useState(null);
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
      setFilePreview(null);
      setPaymentStatus('pending');
      setSelectedCustomer('');
      setHasPreviousRecord(false);
      toast.success('Entry created successfully!');
    } catch (err) {
      console.error('Error creating record:', err);
      console.error('Error response:', err.response?.data);
      
      // Handle validation errors
      let errorMsg = 'Failed to create record';
      if (err.response?.data) {
        if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          errorMsg = err.response.data.errors.join(', ');
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        }
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid rgba(55, 71, 79, 0.1)' }}
      >
        <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b" style={{ backgroundColor: '#F5F5F5', borderColor: 'rgba(55, 71, 79, 0.2)' }}>
          <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#37474F' }}>📊 Add New Electricity Entry</h3>
          <button 
            className="text-2xl font-bold hover:opacity-70 transition-opacity w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
            style={{ color: '#37474F' }}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={submit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {customers.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#37474F' }}>
                👤 Customer (Optional - Leave empty for self)
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => {
                  setSelectedCustomer(e.target.value);
                  setPrevious('');
                  setHasPreviousRecord(false);
                }}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  borderColor: '#e2e8f0',
                  fontSize: '14px',
                  backgroundColor: 'white'
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
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#37474F' }}>
                🔢 Previous Reading {hasPreviousRecord && <span className="text-xs font-normal text-green-600">(Auto-filled)</span>}
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={previous} 
                  onChange={(e) => setPrevious(e.target.value)}
                  className="w-full px-4 py-3 pl-12 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    borderColor: hasPreviousRecord ? '#4CAF50' : '#e2e8f0',
                    fontSize: '14px',
                    backgroundColor: hasPreviousRecord ? '#F1F8F4' : 'white'
                  }}
                  placeholder="Enter previous reading"
                  min="0"
                  required
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🔢</span>
              </div>
              {hasPreviousRecord && (
                <p className="text-xs mt-1" style={{ color: '#4CAF50' }}>
                  ✓ Auto-filled from last record. You can edit if needed.
                </p>
              )}
              {!hasPreviousRecord && (
                <p className="text-xs mt-1" style={{ color: '#666' }}>
                  No previous record found. Please enter manually.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#37474F' }}>
                📈 Current Reading
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={current} 
                  onChange={(e) => {
                    setCurrent(e.target.value);
                    setError('');
                  }} 
                  className="w-full px-4 py-3 pl-12 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    borderColor: error && current ? '#F44336' : '#e2e8f0',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                  required 
                  min={previous ? Number(previous) + 1 : undefined}
                  placeholder="Enter current reading"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📈</span>
              </div>
              {previous && current && Number(current) <= Number(previous) && (
                <p className="text-xs mt-1" style={{ color: '#F44336' }}>
                  ⚠️ Current reading must be greater than previous reading
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#37474F' }}>
                💰 Rate Per Unit (₹)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01" 
                  value={ratePerUnit} 
                  onChange={(e) => setRatePerUnit(e.target.value)} 
                  className="w-full px-4 py-3 pl-12 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    borderColor: '#e2e8f0',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                  placeholder="8.00"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">💰</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#37474F' }}>
                📅 Due Date
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                  className="w-full px-4 py-3 pl-12 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    borderColor: '#e2e8f0',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                  required 
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📅</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Bill Image (Optional)</label>
            <div className="space-y-3">
              <div className="file-input-wrapper">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const selectedFile = e.target.files[0];
                    setFile(selectedFile);
                    if (selectedFile) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFilePreview(reader.result);
                      };
                      reader.readAsDataURL(selectedFile);
                    } else {
                      setFilePreview(null);
                    }
                  }}
                  id="bill-image"
                  className="file-input"
                />
                <label htmlFor="bill-image" className="file-input-label cursor-pointer">
                  <span className="file-icon">📷</span>
                  <span className="file-text">
                    {file ? file.name : 'Choose bill image'}
                  </span>
                </label>
              </div>
              {filePreview && (
                <div className="mt-3 rounded-lg overflow-hidden border-2" style={{ borderColor: '#87CEEB' }}>
                  <div className="relative">
                    <img 
                      src={filePreview} 
                      alt="Bill preview" 
                      className="w-full h-auto max-h-48 object-contain"
                      style={{ backgroundColor: '#F5F5F5' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setFilePreview(null);
                        const fileInput = document.getElementById('bill-image');
                        if (fileInput) fileInput.value = '';
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                      style={{ backgroundColor: '#F44336' }}
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-2 text-xs text-center" style={{ backgroundColor: '#F5F5F5', color: '#37474F' }}>
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#37474F' }}>
              💬 Remarks (Optional)
            </label>
            <div className="relative">
              <textarea
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
                placeholder="Any additional notes..."
                rows="3"
                className="w-full px-4 py-3 pl-12 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all resize-none"
                style={{ 
                  borderColor: '#e2e8f0',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              />
              <span className="absolute left-3 top-3 text-xl">💬</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: '#37474F' }}>
              Payment Status
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  paymentStatus === 'paid' 
                    ? 'shadow-lg scale-105' 
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={paymentStatus === 'paid' 
                  ? { background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)', color: 'white' }
                  : { backgroundColor: '#F5F5F5', color: '#37474F', border: '2px solid #4CAF50' }
                }
              >
                <span className="text-xl">✅</span>
                <span>Paid</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('pending')}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  paymentStatus === 'pending' 
                    ? 'shadow-lg scale-105' 
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={paymentStatus === 'pending' 
                  ? { background: 'linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)', color: '#37474F' }
                  : { backgroundColor: '#F5F5F5', color: '#37474F', border: '2px solid #FFD54F' }
                }
              >
                <span className="text-xl">⏳</span>
                <span>Unpaid</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: '#FFEBEE', border: '1px solid #F44336' }}>
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold" style={{ color: '#D32F2F' }}>Error</p>
                <p className="text-sm mt-1" style={{ color: '#37474F' }}>{error}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'rgba(55, 71, 79, 0.2)' }}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
              style={{ backgroundColor: '#F5F5F5', color: '#37474F', border: '2px solid rgba(55, 71, 79, 0.2)' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">💾</span>
                  <span>Save Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 