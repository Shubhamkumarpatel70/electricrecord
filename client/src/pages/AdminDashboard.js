import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getStoredUser, getToken } from '../utils/auth';
import EditUpiModal from '../components/EditUpiModal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('records'); // 'records', 'customers', or 'payments'
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [imageModal, setImageModal] = useState({ open: false, imageUrl: '', imageAlt: '' });
  const [imageLoading, setImageLoading] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [upiModal, setUpiModal] = useState({ open: false, user: null });

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    
    if (!token || !user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    setLoading(true);
    Promise.all([
      api.get('/api/admin/records'),
      api.get('/api/admin/users').catch(() => ({ data: [] })),
      api.get('/api/admin/customers').catch(() => ({ data: [] }))
    ])
      .then(([recordsRes, usersRes, customersRes]) => {
        setRecords(recordsRes.data);
        setUsers(usersRes.data || []);
        setCustomers(customersRes.data || []);
        setError('');
      })
      .catch((err) => {
        console.error('Error fetching admin data:', err);
        const errorMsg = err.response?.data?.message || 'Failed to fetch records';
        setError(errorMsg);
        toast.error(errorMsg);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  useEffect(() => {
    const url = statusFilter ? `/api/admin/records?status=${statusFilter}` : '/api/admin/records';
    api.get(url)
      .then(({ data }) => {
        setRecords(data);
      })
      .catch((err) => {
        console.error('Error fetching filtered records:', err);
      });
  }, [statusFilter]);

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = [...records];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.user?.meterNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.totalAmount.toString().includes(searchTerm) ||
        r.unitsConsumed.toString().includes(searchTerm)
      );
    }

    // User filter
    if (userFilter) {
      filtered = filtered.filter(r => r.user?._id === userFilter || r.user?.meterNumber === userFilter);
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
        case 'user':
          aVal = a.user?.name || '';
          bVal = b.user?.name || '';
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
  }, [records, searchTerm, statusFilter, dateFilter, userFilter, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedRecords.length;
    const totalAmount = filteredAndSortedRecords.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalUnits = filteredAndSortedRecords.reduce((sum, r) => sum + r.unitsConsumed, 0);
    const pending = filteredAndSortedRecords.filter(r => r.paymentStatus === 'pending').length;
    const paid = filteredAndSortedRecords.filter(r => r.paymentStatus === 'paid').length;
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
    
    // Unique users
    const uniqueUsers = new Set(filteredAndSortedRecords.map(r => r.user?._id).filter(Boolean));
    
    // Monthly revenue
    const monthlyRevenue = {};
    filteredAndSortedRecords.forEach(r => {
      const month = new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = 0;
      }
      monthlyRevenue[month] += r.totalAmount;
    });

    return {
      total,
      totalAmount,
      totalUnits,
      pending,
      paid,
      overdue,
      paidAmount,
      pendingAmount,
      overdueAmount,
      uniqueUsers: uniqueUsers.size,
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({
        month,
        amount
      })).sort((a, b) => new Date(a.month) - new Date(b.month))
    };
  }, [filteredAndSortedRecords]);

  // Chart data
  const statusData = [
    { name: 'Paid', value: stats.paid, color: '#10b981' },
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
    { name: 'Overdue', value: stats.overdue, color: '#ef4444' },
  ];

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/admin/records/${id}/payment`, { status });
      setRecords((prev) => prev.map((r) => (r._id === id ? { ...r, paymentStatus: status } : r)));
      toast.success('Payment status updated successfully!');
    } catch (err) {
      console.error('Error updating status:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update payment status';
      toast.error(errorMsg);
    }
  };

  const exportRecords = () => {
    const csvContent = [
      ['Date', 'User', 'Email', 'Meter Number', 'Previous Reading', 'Current Reading', 'Units', 'Amount', 'Due Date', 'Status', 'Payment Date', 'Remarks'],
      ...filteredAndSortedRecords.map(r => [
        new Date(r.createdAt).toLocaleDateString(),
        r.user?.name || '',
        r.user?.email || '',
        r.user?.meterNumber || '',
        r.previousReading,
        r.currentReading,
        r.unitsConsumed,
        r.totalAmount.toFixed(2),
        r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '',
        r.paymentStatus,
        r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : '',
        r.remarks || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electricity-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Records exported successfully!');
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.REACT_APP_API_URL || '') 
      : 'http://localhost:5000';
    return `${apiUrl}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
  };

  const openImageModal = (imageUrl, userName, meterNumber, imageType = 'Bill') => {
    const fullImageUrl = getImageUrl(imageUrl);
    if (!fullImageUrl) return;
    
    setImageModal({
      open: true,
      imageUrl: fullImageUrl,
      imageAlt: `${imageType} image for ${userName} (${meterNumber})`
    });
    setImageLoading(true);
  };

  const closeImageModal = () => {
    setImageModal({ open: false, imageUrl: '', imageAlt: '' });
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

  // Get unique users for filter (must be before early return)
  const uniqueUsersList = useMemo(() => {
    const userMap = new Map();
    records.forEach(r => {
      if (r.user && !userMap.has(r.user._id)) {
        userMap.set(r.user._id, r.user);
      }
    });
    return Array.from(userMap.values());
  }, [records]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <h2>Loading admin dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>⚡ Admin Dashboard</h1>
          <p>Manage all electricity records and users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: '24px' }}>
        <button
          className={`tab-button ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          📊 Records
        </button>
        <button
          className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          👥 Customers
        </button>
        <button
          className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💳 Payment System
        </button>
      </div>

      {activeTab === 'records' ? (
        <>
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Records</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>₹{stats.totalAmount.toFixed(2)}</h3>
            <p>Total Revenue</p>
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
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.paid}</h3>
            <p>Paid (₹{stats.paidAmount.toFixed(2)})</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending (₹{stats.pendingAmount.toFixed(2)})</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>{stats.overdue}</h3>
            <p>Overdue (₹{stats.overdueAmount.toFixed(2)})</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.uniqueUsers}</h3>
            <p>Active Users</p>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      {stats.monthlyRevenue.length > 0 && (
        <div className="records-section" style={{ marginBottom: '24px' }}>
          <h2>📈 Monthly Revenue Trend</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => `₹${value.toFixed(2)}`}
                />
                <Bar dataKey="amount" fill="#667eea" radius={[8, 8, 0, 0]} name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Payment Status Chart */}
      {records.length > 0 && (
        <div className="records-section" style={{ marginBottom: '24px' }}>
          <h2>📊 Payment Status Overview</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

          <div className="records-section">
            <div className="header">
              <h2>All Records</h2>
            </div>
      
            {error && (
              <div className="error-message" style={{ marginBottom: '24px' }}>
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Enhanced Filters */}
            <div className="filters">
        <div className="filter-group">
          <label htmlFor="search">🔍 Search:</label>
          <input
            id="search"
            type="text"
            placeholder="Search by name, email, meter number..."
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
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="userFilter">User:</label>
          <select 
            id="userFilter"
            value={userFilter} 
            onChange={(e) => setUserFilter(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              borderRadius: '8px', 
              border: '2px solid #e2e8f0',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            <option value="">All Users</option>
            {uniqueUsersList.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.meterNumber})
              </option>
            ))}
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
            <option value="user">User</option>
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
        <div className="filter-actions">
          <div className="filter-info">
            Showing {filteredAndSortedRecords.length} of {records.length} records
          </div>
          <button 
            className="export-btn" 
            onClick={exportRecords}
            disabled={filteredAndSortedRecords.length === 0}
          >
            📥 Export CSV
          </button>
            </div>
            </div>

            <div className="table-container">
              <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>User</th>
            <th>Previous</th>
            <th>Current</th>
            <th>Units</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Remarks</th>
            <th>Bill Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedRecords.length === 0 ? (
            <tr>
              <td colSpan="11" className="empty-state">
                <div className="empty-content">
                  <div className="empty-icon">📊</div>
                  <h3>No records found</h3>
                  <p>
                    {records.length === 0 
                      ? "No records in the system yet."
                      : "Try adjusting your filters to see more results."
                    }
                  </p>
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
                <td>
                  <div>
                    <div style={{ fontWeight: '600' }}>{r.user?.name || 'N/A'}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {r.user?.meterNumber || 'N/A'}
                    </div>
                    {r.user?.email && (
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        {r.user.email}
                      </div>
                    )}
                  </div>
                </td>
                <td>{r.previousReading}</td>
                <td>{r.currentReading}</td>
                <td>
                  <span className="units-badge">{r.unitsConsumed} units</span>
                </td>
                <td>
                  <span className="amount-badge">₹{r.totalAmount.toFixed(2)}</span>
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
                  <span className={`status-badge status-${r.paymentStatus}`}>
                    {r.paymentStatus}
                  </span>
                  {r.paymentDate && r.paymentStatus === 'paid' && (
                    <div className="payment-date">
                      Paid: {new Date(r.paymentDate).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="remarks-cell" title={r.remarks || 'No remarks'}>
                  {r.remarks || '-'}
                </td>
                <td>
                  {(r.billImage || r.paymentScreenshot) ? (
                    <div className="flex flex-col gap-2">
                      {/* Bill Image */}
                      {r.billImage && (
                        <div className="flex items-center gap-2">
                          <div 
                            className="relative group cursor-pointer"
                            onClick={() => openImageModal(r.billImage, r.user?.name, r.user?.meterNumber, 'Bill')}
                            title="Click to view bill image"
                          >
                            <div className="relative">
                              <img 
                                src={getImageUrl(r.billImage)} 
                                alt="Bill thumbnail"
                                className="w-16 h-16 object-cover rounded-lg border-2 shadow-md hover:shadow-lg transition-all group-hover:scale-105"
                                style={{ borderColor: '#87CEEB' }}
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'flex';
                                  }
                                }}
                              />
                              <div 
                                className="hidden w-16 h-16 rounded-lg border-2 items-center justify-center text-2xl"
                                style={{ borderColor: '#87CEEB', backgroundColor: '#F5F5F5' }}
                              >
                                📷
                              </div>
                              <div className="absolute top-0 left-0 px-1.5 py-0.5 rounded-br-lg text-xs font-semibold text-white" style={{ backgroundColor: '#87CEEB' }}>
                                Bill
                              </div>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                                <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                  View
                                </span>
                              </div>
                            </div>
                          </div>
                          <button 
                            className="px-2 py-1 rounded text-xs font-semibold hover:shadow-md transition-all"
                            style={{ backgroundColor: '#87CEEB', color: 'white' }}
                            onClick={() => openImageModal(r.billImage, r.user?.name, r.user?.meterNumber, 'Bill')}
                            title="View bill image"
                          >
                            View
                          </button>
                        </div>
                      )}
                      
                      {/* Payment Screenshot */}
                      {r.paymentScreenshot && (
                        <div className="flex items-center gap-2">
                          <div 
                            className="relative group cursor-pointer"
                            onClick={() => openImageModal(r.paymentScreenshot, r.user?.name, r.user?.meterNumber, 'Payment')}
                            title="Click to view payment screenshot"
                          >
                            <div className="relative">
                              <img 
                                src={getImageUrl(r.paymentScreenshot)} 
                                alt="Payment screenshot thumbnail"
                                className="w-16 h-16 object-cover rounded-lg border-2 shadow-md hover:shadow-lg transition-all group-hover:scale-105"
                                style={{ borderColor: '#4CAF50' }}
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'flex';
                                  }
                                }}
                              />
                              <div 
                                className="hidden w-16 h-16 rounded-lg border-2 items-center justify-center text-2xl"
                                style={{ borderColor: '#4CAF50', backgroundColor: '#F5F5F5' }}
                              >
                                💳
                              </div>
                              <div className="absolute top-0 left-0 px-1.5 py-0.5 rounded-br-lg text-xs font-semibold text-white" style={{ backgroundColor: '#4CAF50' }}>
                                Payment
                              </div>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                                <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                  View
                                </span>
                              </div>
                            </div>
                          </div>
                          <button 
                            className="px-2 py-1 rounded text-xs font-semibold hover:shadow-md transition-all"
                            style={{ backgroundColor: '#4CAF50', color: 'white' }}
                            onClick={() => openImageModal(r.paymentScreenshot, r.user?.name, r.user?.meterNumber, 'Payment')}
                            title="View payment screenshot"
                          >
                            View
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: '#999' }}>No image</span>
                  )}
                </td>
                <td>
                  <select 
                    value={r.paymentStatus} 
                    onChange={(e) => updateStatus(r._id, e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '2px solid #e2e8f0',
                      fontSize: '13px',
                      cursor: 'pointer',
                      background: 'white'
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
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
          <div className="records-section">
            <h2>All Customers</h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Meter Number</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Total Units</th>
                    <th>Total Amount</th>
                    <th>Paid/Unpaid</th>
                    <th>Status</th>
                    <th>Added By</th>
                    <th>Added Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="empty-state">
                        <div className="empty-content">
                          <div className="empty-icon">👥</div>
                          <h3>No customers found</h3>
                          <p>No customers have been added by users yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => {
                      const stats = customer.stats || {
                        totalUnits: 0,
                        totalAmount: 0,
                        paidAmount: 0,
                        unpaidAmount: 0,
                        paidCount: 0,
                        unpaidCount: 0,
                        totalRecords: 0
                      };
                      const isFullyPaid = stats.totalRecords > 0 && stats.unpaidAmount === 0;
                      const hasUnpaid = stats.unpaidAmount > 0;
                      
                      return (
                        <tr key={customer._id} className="record-row">
                          <td style={{ fontWeight: '600' }}>{customer.name}</td>
                          <td>{customer.meterNumber}</td>
                          <td>{customer.phone}</td>
                          <td>{customer.email || '-'}</td>
                          <td>
                            <span className="units-badge">{stats.totalUnits || 0} units</span>
                            {stats.totalRecords > 0 && (
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                ({stats.totalRecords} records)
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="amount-badge">₹{(stats.totalAmount || 0).toFixed(2)}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ fontSize: '12px', color: '#10b981' }}>
                                Paid: ₹{(stats.paidAmount || 0).toFixed(2)} ({stats.paidCount || 0})
                              </div>
                              <div style={{ fontSize: '12px', color: '#ef4444' }}>
                                Unpaid: ₹{(stats.unpaidAmount || 0).toFixed(2)} ({stats.unpaidCount || 0})
                              </div>
                            </div>
                          </td>
                          <td>
                            {stats.totalRecords === 0 ? (
                              <span style={{ color: '#999' }}>No records</span>
                            ) : isFullyPaid ? (
                              <span className="status-badge status-paid">Fully Paid</span>
                            ) : hasUnpaid ? (
                              <span className="status-badge status-pending">Has Unpaid</span>
                            ) : (
                              <span className="status-badge status-pending">Pending</span>
                            )}
                          </td>
                          <td>
                            <div>
                              <div style={{ fontWeight: '600' }}>{customer.addedBy?.name || 'N/A'}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {customer.addedBy?.email || ''}
                              </div>
                              {customer.addedBy?.meterNumber && (
                                <div style={{ fontSize: '11px', color: '#999' }}>
                                  Meter: {customer.addedBy.meterNumber}
                                </div>
                              )}
                              {customer.addedBy?.upiId && (
                                <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '4px', fontWeight: '500' }}>
                                  💳 UPI: {customer.addedBy.upiId}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="date-cell">
                              <div className="date-main">{new Date(customer.createdAt).toLocaleDateString()}</div>
                              <div className="date-time">{new Date(customer.createdAt).toLocaleTimeString()}</div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeTab === 'payments' ? (
        <>
          <div className="records-section">
            <h2>💳 Payment System Management</h2>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
              Manage UPI IDs for all users. Users can set their own UPI IDs, and admins can view and update them.
            </p>
            
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Email</th>
                    <th>Meter Number</th>
                    <th>Current UPI ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        <div className="empty-content">
                          <div className="empty-icon">👥</div>
                          <h3>No users found</h3>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="record-row">
                        <td style={{ fontWeight: '600' }}>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.meterNumber}</td>
                        <td>
                          <div style={{ 
                            color: user.upiId ? '#6366f1' : '#999',
                            fontWeight: user.upiId ? '500' : 'normal',
                            wordBreak: 'break-all'
                          }}>
                            {user.upiId || 'Not set'}
                          </div>
                        </td>
                        <td>
                          <button
                            className="action-btn edit"
                            onClick={() => setUpiModal({ open: true, user })}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      <EditUpiModal
        open={upiModal.open}
        onClose={() => setUpiModal({ open: false, user: null })}
        user={upiModal.user}
        onUpdated={(updatedUser) => {
          setUsers((prev) => prev.map((u) => 
            u._id === updatedUser._id ? { ...u, upiId: updatedUser.upiId } : u
          ));
          setUpiModal({ open: false, user: null });
        }}
      />

      {/* Image Modal */}
      {imageModal.open && (
        <div className="modal" onClick={closeImageModal}>
          <div className="modal-content image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{imageModal.imageAlt?.includes('Payment') ? 'Payment Screenshot' : 'Bill Image'}</h3>
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
                crossOrigin="anonymous"
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
