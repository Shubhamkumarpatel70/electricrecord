import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, Legend } from 'recharts';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getStoredUser, getToken } from '../utils/auth';
import AddEntryModal from '../components/AddEntryModal';
import EditEntryModal from '../components/EditEntryModal';
import AddCustomerModal from '../components/AddCustomerModal';
import ShareCustomerModal from '../components/ShareCustomerModal';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('entries'); // 'entries', 'customers', or 'settings'
  const [user, setUser] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, record: null });
  const [customerModal, setCustomerModal] = useState({ open: false, customer: null });
  const [shareModal, setShareModal] = useState({ open: false, customer: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageModal, setImageModal] = useState({ open: false, imageUrl: '', imageAlt: '' });
  const [imageLoading, setImageLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [customerFilter, setCustomerFilter] = useState('');

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    
    if (!token || !user || user.role !== 'user') {
      navigate('/login');
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/records/mine'),
      api.get('/api/customers'),
      api.get('/api/auth/profile')
    ])
      .then(([recordsRes, customersRes, profileRes]) => {
        const currentUser = getStoredUser();
        if (profileRes.data?.data?.user) {
          setUser(profileRes.data.data.user);
          setUpiId(profileRes.data.data.user.upiId || '');
          // Update stored user
          if (currentUser) {
            const updatedUser = { ...currentUser, ...profileRes.data.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else if (currentUser) {
          setUser(currentUser);
          setUpiId(currentUser.upiId || '');
        }
        setRecords(recordsRes.data);
        setCustomers(customersRes.data);
        setError('');
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        const errorMsg = err.response?.data?.message || 'Failed to fetch data';
        setError(errorMsg);
        toast.error(errorMsg);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = [...records];

    // Customer filter
    if (customerFilter) {
      if (customerFilter === 'self') {
        filtered = filtered.filter(r => !r.customer);
      } else {
        filtered = filtered.filter(r => r.customer?._id === customerFilter);
      }
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.totalAmount.toString().includes(searchTerm) ||
        r.unitsConsumed.toString().includes(searchTerm) ||
        r.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(r => r.paymentStatus === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(r => new Date(r.createdAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(r => new Date(r.createdAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(r => new Date(r.createdAt) >= filterDate);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(r => new Date(r.createdAt) >= filterDate);
          break;
        default:
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        case 'amount':
          aVal = a.totalAmount;
          bVal = b.totalAmount;
          break;
        case 'units':
          aVal = a.unitsConsumed;
          bVal = b.unitsConsumed;
          break;
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [records, searchTerm, statusFilter, dateFilter, sortBy, sortOrder, customerFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedRecords.length;
    const totalAmount = filteredAndSortedRecords.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalUnits = filteredAndSortedRecords.reduce((sum, r) => sum + r.unitsConsumed, 0);
    const paid = filteredAndSortedRecords.filter(r => r.paymentStatus === 'paid').length;
    const pending = filteredAndSortedRecords.filter(r => r.paymentStatus === 'pending').length;
    const overdue = filteredAndSortedRecords.filter(r => r.paymentStatus === 'overdue').length;
    const paidAmount = filteredAndSortedRecords
      .filter(r => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + r.totalAmount, 0);
    const pendingAmount = filteredAndSortedRecords
      .filter(r => r.paymentStatus === 'pending')
      .reduce((sum, r) => sum + r.totalAmount, 0);
    const overdueAmount = filteredAndSortedRecords
      .filter(r => r.paymentStatus === 'overdue')
      .reduce((sum, r) => sum + r.totalAmount, 0);
    const avgBill = total > 0 ? totalAmount / total : 0;
    const avgUnits = total > 0 ? totalUnits / total : 0;

    // Monthly comparison
    const monthlyData = {};
    filteredAndSortedRecords.forEach(r => {
      const month = new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { amount: 0, units: 0, count: 0 };
      }
      monthlyData[month].amount += r.totalAmount;
      monthlyData[month].units += r.unitsConsumed;
      monthlyData[month].count += 1;
    });

    return {
      total,
      totalAmount,
      totalUnits,
      paid,
      pending,
      overdue,
      paidAmount,
      pendingAmount,
      overdueAmount,
      avgBill,
      avgUnits,
      monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        amount: data.amount,
        units: data.units,
        count: data.count
      })).sort((a, b) => new Date(a.month) - new Date(b.month))
    };
  }, [filteredAndSortedRecords]);

  const openImageModal = (imageUrl, date) => {
    setImageModal({
      open: true,
      imageUrl,
      imageAlt: `Bill image for ${date}`
    });
    setImageLoading(true);
  };

  const closeImageModal = () => {
    setImageModal({ open: false, imageUrl: '', imageAlt: '' });
  };

  const updatePaymentStatus = async (id, status) => {
    try {
      await api.put(`/api/records/${id}/payment-status`, { status });
      setRecords((prev) => prev.map((r) => 
        r._id === id 
          ? { 
              ...r, 
              paymentStatus: status === 'unpaid' ? 'pending' : status,
              paymentDate: status === 'paid' ? new Date() : undefined
            } 
          : r
      ));
      toast.success(`Payment status updated to ${status === 'unpaid' ? 'pending' : status}!`);
    } catch (err) {
      console.error('Error updating payment status:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update payment status';
      toast.error(errorMsg);
    }
  };

  const exportRecords = () => {
    const csvContent = [
      ['Date', 'Customer', 'Previous Reading', 'Current Reading', 'Units Consumed', 'Rate/Unit', 'Amount', 'Due Date', 'Status', 'Remarks'],
      ...filteredAndSortedRecords.map(r => [
        new Date(r.createdAt).toLocaleDateString(),
        r.customer?.name || 'Self',
        r.previousReading,
        r.currentReading,
        r.unitsConsumed,
        r.ratePerUnit,
        r.totalAmount.toFixed(2),
        r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '',
        r.paymentStatus,
        r.remarks || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-electricity-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Records exported successfully!');
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await api.delete(`/api/customers/${id}`);
      setCustomers((prev) => prev.filter(c => c._id !== id));
      toast.success('Customer deleted successfully!');
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error('Failed to delete customer');
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && imageModal.open) {
        closeImageModal();
      }
    };

    if (imageModal.open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [imageModal.open]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <h2>Loading your dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>⚡ Electricity Dashboard</h1>
          <p>Manage your electricity meter readings and bills</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: '24px' }}>
        <button
          className={`tab-button ${activeTab === 'entries' ? 'active' : ''}`}
          onClick={() => setActiveTab('entries')}
        >
          📊 View/Add Entry
        </button>
        <button
          className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          👥 Customers
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Payment Settings
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {activeTab === 'entries' ? (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'flex-end' }}>
            <button 
              className="export-btn" 
              onClick={exportRecords}
              disabled={filteredAndSortedRecords.length === 0}
            >
              📥 Export CSV
            </button>
            <button className="add-entry-btn" onClick={() => setOpen(true)}>
              <span className="btn-icon">➕</span>
              Add New Entry
            </button>
          </div>

          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{stats.total}</h3>
                <p>Total Entries</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>₹{stats.totalAmount.toFixed(2)}</h3>
                <p>Total Amount</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <h3>{stats.totalUnits}</h3>
                <p>Total Units</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>₹{stats.avgBill.toFixed(2)}</h3>
                <p>Average Bill</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{stats.paid}</h3>
                <p>Paid ({stats.paidAmount.toFixed(2)})</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{stats.pending}</h3>
                <p>Pending ({stats.pendingAmount.toFixed(2)})</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="filters">
            <div className="filter-group">
              <label htmlFor="search">🔍 Search:</label>
              <input
                id="search"
                type="text"
                placeholder="Search by amount, units, remarks, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  minWidth: '250px'
                }}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="customerFilter">Customer:</label>
              <select 
                id="customerFilter"
                value={customerFilter} 
                onChange={(e) => setCustomerFilter(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  border: '2px solid #e2e8f0',
                  fontSize: '14px'
                }}
              >
                <option value="">All (Self + Customers)</option>
                <option value="self">Self Only</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="statusFilter">Status:</label>
              <select 
                id="statusFilter"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  border: '2px solid #e2e8f0',
                  fontSize: '14px'
                }}
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="dateFilter">Date Range:</label>
              <select 
                id="dateFilter"
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  border: '2px solid #e2e8f0',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="sortBy">Sort By:</label>
              <select 
                id="sortBy"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  border: '2px solid #e2e8f0',
                  fontSize: '14px'
                }}
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="units">Units</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="sortOrder">Order:</label>
              <select 
                id="sortOrder"
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  border: '2px solid #e2e8f0',
                  fontSize: '14px'
                }}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
            <div className="filter-info">
              Showing {filteredAndSortedRecords.length} of {records.length} records
            </div>
          </div>

          {/* Charts and Records - keeping existing code */}
          {/* ... (rest of the entries tab content from original UserDashboard.js) ... */}
          
          <div className="records-section">
            <h2>Your Records</h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Previous</th>
                    <th>Current</th>
                    <th>Units</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Bill Image</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedRecords.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="empty-state">
                        <div className="empty-content">
                          <div className="empty-icon">📊</div>
                          <h3>No records found</h3>
                          <p>
                            {records.length === 0 
                              ? "Add your first electricity entry to get started!"
                              : "Try adjusting your filters to see more results."
                            }
                          </p>
                          {records.length === 0 && (
                            <button onClick={() => setOpen(true)} className="empty-btn">
                              Add First Entry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedRecords.map((r) => (
                      <tr key={r._id} className="record-row">
                        <td>
                          <div className="date-cell">
                            <div className="date-main">{new Date(r.createdAt).toLocaleDateString()}</div>
                            <div className="date-time">{new Date(r.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </td>
                        <td>{r.customer?.name || 'Self'}</td>
                        <td>{r.previousReading}</td>
                        <td>{r.currentReading}</td>
                        <td>
                          <span className="units-badge">{r.unitsConsumed} units</span>
                        </td>
                        <td>
                          <span className="amount-badge">₹{r.totalAmount.toFixed(2)}</span>
                        </td>
                        <td>
                          <span className={`status-badge status-${r.paymentStatus}`}>
                            {r.paymentStatus}
                          </span>
                        </td>
                        <td>
                          {r.dueDate ? (
                            <div>
                              <div>{new Date(r.dueDate).toLocaleDateString()}</div>
                              {new Date(r.dueDate) < new Date() && r.paymentStatus !== 'paid' && (
                                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                                  Overdue
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#999' }}>-</span>
                          )}
                        </td>
                        <td>
                          {r.billImage ? (
                            <button 
                              className="view-bill-btn"
                              onClick={() => openImageModal(r.billImage, new Date(r.createdAt).toLocaleDateString())}
                              title="View bill image"
                            >
                              <span className="btn-icon">📷</span>
                              View
                            </button>
                          ) : (
                            <span className="no-image">No image</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit"
                              onClick={() => setEditModal({ open: true, record: r })}
                              title="Edit entry"
                            >
                              <span>✏️</span>
                              Edit
                            </button>
                            {r.paymentStatus === 'paid' ? (
                              <button
                                className="action-btn unpaid"
                                onClick={() => updatePaymentStatus(r._id, 'unpaid')}
                                title="Mark as unpaid"
                              >
                                <span>⏳</span>
                                Unpaid
                              </button>
                            ) : (
                              <button
                                className="action-btn paid"
                                onClick={() => updatePaymentStatus(r._id, 'paid')}
                                title="Mark as paid"
                              >
                                <span>✅</span>
                                Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeTab === 'customers' ? (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'flex-end' }}>
            <button 
              className="add-entry-btn" 
              onClick={() => setCustomerModal({ open: true, customer: null })}
            >
              <span className="btn-icon">➕</span>
              Add Customer
            </button>
          </div>

          <div className="records-section">
            <h2>Your Customers</h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Meter Number</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        <div className="empty-content">
                          <div className="empty-icon">👥</div>
                          <h3>No customers yet</h3>
                          <p>Add your first customer to start tracking their electricity records!</p>
                          <button onClick={() => setCustomerModal({ open: true, customer: null })} className="empty-btn">
                            Add First Customer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer._id} className="record-row">
                        <td style={{ fontWeight: '600' }}>{customer.name}</td>
                        <td>{customer.meterNumber}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.email || '-'}</td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={customer.address}>
                          {customer.address}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit"
                              onClick={() => setCustomerModal({ open: true, customer })}
                              title="Edit customer"
                            >
                              <span>✏️</span>
                              Edit
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => setShareModal({ open: true, customer })}
                              title="Share customer summary"
                            >
                              <span>📤</span>
                              Share
                            </button>
                            <button
                              className="action-btn unpaid"
                              onClick={() => deleteCustomer(customer._id)}
                              title="Delete customer"
                            >
                              <span>🗑️</span>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeTab === 'settings' ? (
        <>
          <div className="dashboard-card">
            <h2 style={{ marginBottom: '20px' }}>💳 Payment Settings</h2>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
              Configure your UPI ID to receive payments from customers. This will be displayed when customers click "Pay Now" in the share view.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setSettingsLoading(true);
              try {
                const { data } = await api.put('/api/auth/profile', { upiId });
                const updatedUser = data.data.user;
                setUser(updatedUser);
                setUpiId(updatedUser.upiId || '');
                // Update stored user
                const currentUser = getStoredUser();
                if (currentUser) {
                  const newUser = { ...currentUser, ...updatedUser };
                  localStorage.setItem('user', JSON.stringify(newUser));
                }
                toast.success('UPI ID updated successfully!');
              } catch (err) {
                console.error('Error updating UPI ID:', err);
                toast.error(err.response?.data?.message || 'Failed to update UPI ID');
              } finally {
                setSettingsLoading(false);
              }
            }}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="upiId">UPI ID</label>
                <div className="input-wrapper">
                  <span className="input-icon">💳</span>
                  <input
                    id="upiId"
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g., yourname@paytm, yourname@ybl, yourname@okaxis"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', marginLeft: '40px' }}>
                  Enter your UPI ID (e.g., yourname@paytm, yourname@ybl, yourname@okaxis)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    const currentUser = getStoredUser();
                    setUpiId(currentUser?.upiId || '');
                  }}
                  disabled={settingsLoading}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="auth-submit"
                  disabled={settingsLoading}
                >
                  {settingsLoading ? (
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

            {upiId && (
              <div style={{
                marginTop: '24px',
                padding: '20px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>Your Current UPI ID:</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', wordBreak: 'break-all', marginBottom: '12px' }}>
                  {upiId}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(upiId);
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
            )}
          </div>
        </>
      ) : null}

      <AddEntryModal 
        open={open} 
        onClose={() => setOpen(false)}
        customers={customers}
        onCreated={(rec) => {
          setRecords((prev) => [rec, ...prev]);
          toast.success('Entry added successfully!');
        }} 
      />

      <EditEntryModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, record: null })}
        record={editModal.record}
        onUpdated={(updatedRecord) => {
          setRecords((prev) => prev.map((r) => 
            r._id === updatedRecord._id ? updatedRecord : r
          ));
          setEditModal({ open: false, record: null });
        }}
      />

      <AddCustomerModal
        open={customerModal.open}
        onClose={() => setCustomerModal({ open: false, customer: null })}
        customer={customerModal.customer}
        onCreated={(customer) => {
          if (customerModal.customer) {
            setCustomers((prev) => prev.map((c) => 
              c._id === customer._id ? customer : c
            ));
          } else {
            setCustomers((prev) => [customer, ...prev]);
          }
          setCustomerModal({ open: false, customer: null });
        }}
      />

      <ShareCustomerModal
        open={shareModal.open}
        onClose={() => setShareModal({ open: false, customer: null })}
        customer={shareModal.customer}
      />

      {/* Bill Image Modal */}
      {imageModal.open && (
        <div className="modal" onClick={closeImageModal}>
          <div className="modal-content image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bill Image</h3>
              <button className="close-btn" onClick={closeImageModal}>×</button>
            </div>
            <div className="modal-body">
              {imageLoading && (
                <div className="image-loading">
                  <div className="spinner"></div>
                  <p>Loading image...</p>
                </div>
              )}
              <img 
                src={imageModal.imageUrl} 
                alt={imageModal.imageAlt}
                style={{ display: imageLoading ? 'none' : 'block' }}
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  setImageLoading(false);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="image-error-modal" style={{ display: 'none' }}>
                <p>Image could not be loaded</p>
                <p>Please check if the image file exists and is accessible.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary" onClick={closeImageModal}>Close</button>
              <button 
                onClick={() => window.open(imageModal.imageUrl, '_blank')}
                title="Open in new tab"
              >
                Open in New Tab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
