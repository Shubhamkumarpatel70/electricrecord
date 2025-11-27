import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getStoredUser, getToken } from '../utils/auth';
import AddEntryModal from '../components/AddEntryModal';
import EditEntryModal from '../components/EditEntryModal';
import AddCustomerModal from '../components/AddCustomerModal';
import ShareCustomerModal from '../components/ShareCustomerModal';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('entries'); // 'entries', 'customers', 'payments', or 'settings'
  const [, setUser] = useState(null);
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
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

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
    // Ensure image URL includes the full API URL if it's a relative path
    let fullImageUrl = imageUrl;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? (process.env.REACT_APP_API_URL || '') 
        : 'http://localhost:5000';
      fullImageUrl = `${apiUrl}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
    }
    
    setImageModal({
      open: true,
      imageUrl: fullImageUrl,
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

  const loadPendingPayments = () => {
    setPaymentsLoading(true);
    api.get('/api/records/pending-payments')
      .then((response) => {
        setPendingPayments(response.data);
      })
      .catch((err) => {
        console.error('Error fetching pending payments:', err);
        toast.error(err.response?.data?.message || 'Failed to fetch pending payments');
      })
      .finally(() => {
        setPaymentsLoading(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'payments') {
      loadPendingPayments();
    }
  }, [activeTab]);

  const handleApprovePayment = async (recordId) => {
    try {
      const { data } = await api.put(`/api/records/${recordId}/approve-payment`);
      toast.success('Payment approved successfully!');
      // Refresh data
      loadData();
      loadPendingPayments();
      // Update records list
      setRecords((prev) => prev.map((r) => 
        r._id === recordId ? data.record : r
      ));
    } catch (err) {
      console.error('Error approving payment:', err);
      toast.error(err.response?.data?.message || 'Failed to approve payment');
    }
  };

  const handleRejectPayment = async (recordId) => {
    if (!window.confirm('Are you sure you want to reject this payment? The customer will need to submit a new payment screenshot.')) {
      return;
    }
    try {
      const { data } = await api.put(`/api/records/${recordId}/reject-payment`);
      toast.success('Payment rejected. Customer can submit a new payment screenshot.');
      // Refresh data
      loadData();
      loadPendingPayments();
      // Update records list
      setRecords((prev) => prev.map((r) => 
        r._id === recordId ? data.record : r
      ));
    } catch (err) {
      console.error('Error rejecting payment:', err);
      toast.error(err.response?.data?.message || 'Failed to reject payment');
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
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="rounded-2xl shadow-xl p-8 sm:p-12 text-center" style={{ backgroundColor: '#F5F5F5' }}>
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#87CEEB' }}></div>
          <h2 className="text-xl sm:text-2xl font-semibold" style={{ color: '#37474F' }}>Loading your dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="rounded-2xl shadow-xl p-6 sm:p-8 mb-6 backdrop-blur-sm" style={{ backgroundColor: 'rgba(245, 245, 245, 0.95)', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2" style={{ color: '#37474F' }}>
              ⚡ Electricity Dashboard
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#37474F', opacity: 0.8 }}>Manage your electricity meter readings and bills</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 rounded-xl p-2 shadow-lg backdrop-blur-sm" style={{ backgroundColor: 'rgba(245, 245, 245, 0.95)' }}>
          <button
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
              activeTab === 'entries'
                ? 'text-white shadow-lg'
                : ''
            }`}
            style={activeTab === 'entries' 
              ? { background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }
              : { backgroundColor: '#F5F5F5', color: '#37474F' }
            }
            onClick={() => setActiveTab('entries')}
          >
            📊 <span className="hidden sm:inline">View/Add Entry</span><span className="sm:hidden">Entry</span>
          </button>
          <button
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
              activeTab === 'customers'
                ? 'text-white shadow-lg'
                : ''
            }`}
            style={activeTab === 'customers' 
              ? { background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }
              : { backgroundColor: '#F5F5F5', color: '#37474F' }
            }
            onClick={() => setActiveTab('customers')}
          >
            👥 Customers
          </button>
          <button
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
              activeTab === 'payments'
                ? 'text-white shadow-lg'
                : ''
            }`}
            style={activeTab === 'payments' 
              ? { background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }
              : { backgroundColor: '#F5F5F5', color: '#37474F' }
            }
            onClick={() => setActiveTab('payments')}
          >
            💳 <span className="hidden sm:inline">Payment Requests</span><span className="sm:hidden">Payments</span>
          </button>
          <button
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
              activeTab === 'settings'
                ? 'text-white shadow-lg'
                : ''
            }`}
            style={activeTab === 'settings' 
              ? { background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }
              : { backgroundColor: '#F5F5F5', color: '#37474F' }
            }
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ <span className="hidden sm:inline">Payment Settings</span><span className="sm:hidden">Settings</span>
          </button>
        </div>
      
      {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span className="text-red-700 text-sm sm:text-base">{error}</span>
        </div>
      )}

      {activeTab === 'entries' ? (
        <>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 justify-end">
            <button 
              className="text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}
              onClick={exportRecords}
              disabled={filteredAndSortedRecords.length === 0}
            >
              📥 <span>Export CSV</span>
            </button>
            <button 
              className="text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
              onClick={() => setOpen(true)}
            >
              ➕ <span>Add New Entry</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="rounded-xl p-4 sm:p-6 shadow-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.1)' }}>
              <div className="text-3xl sm:text-4xl mb-2">📊</div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#37474F' }}>{stats.total}</h3>
                <p className="text-xs sm:text-sm mt-1" style={{ color: '#37474F', opacity: 0.7 }}>Total Entries</p>
              </div>
            </div>
            <div className="rounded-xl p-4 sm:p-6 shadow-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.1)' }}>
              <div className="text-3xl sm:text-4xl mb-2">💰</div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#37474F' }}>₹{stats.totalAmount.toFixed(2)}</h3>
                <p className="text-xs sm:text-sm mt-1" style={{ color: '#37474F', opacity: 0.7 }}>Total Amount</p>
              </div>
            </div>
            <div className="rounded-xl p-4 sm:p-6 shadow-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.1)' }}>
              <div className="text-3xl sm:text-4xl mb-2">⚡</div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#37474F' }}>{stats.totalUnits}</h3>
                <p className="text-xs sm:text-sm mt-1" style={{ color: '#37474F', opacity: 0.7 }}>Total Units</p>
              </div>
            </div>
            <div className="rounded-xl p-4 sm:p-6 shadow-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.1)' }}>
              <div className="text-3xl sm:text-4xl mb-2">📈</div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#37474F' }}>₹{stats.avgBill.toFixed(2)}</h3>
                <p className="text-xs sm:text-sm mt-1" style={{ color: '#37474F', opacity: 0.7 }}>Average Bill</p>
          </div>
        </div>
            <div className="rounded-xl p-4 sm:p-6 shadow-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.1)' }}>
              <div className="text-3xl sm:text-4xl mb-2">✅</div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#37474F' }}>{stats.paid}</h3>
                <p className="text-xs sm:text-sm mt-1" style={{ color: '#37474F', opacity: 0.7 }}>Paid (₹{stats.paidAmount.toFixed(2)})</p>
          </div>
        </div>
            <div className="rounded-xl p-4 sm:p-6 shadow-lg" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.1)' }}>
              <div className="text-3xl sm:text-4xl mb-2">⏳</div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold" style={{ color: '#37474F' }}>{stats.pending}</h3>
                <p className="text-xs sm:text-sm mt-1" style={{ color: '#37474F', opacity: 0.7 }}>Pending (₹{stats.pendingAmount.toFixed(2)})</p>
          </div>
        </div>
      </div>

          {/* Filters and Search */}
          <div className="rounded-xl p-4 sm:p-6 shadow-lg mb-6" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.1)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Search
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
              <div>
                <label htmlFor="customerFilter" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer
                </label>
                <select 
                  id="customerFilter"
                  value={customerFilter} 
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="">All (Self + Customers)</option>
                  <option value="self">Self Only</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select 
                  id="statusFilter"
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select 
                  id="dateFilter"
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select 
                  id="sortBy"
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="units">Units</option>
                </select>
              </div>
              <div>
                <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <select 
                  id="sortOrder"
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-center sm:text-left" style={{ color: '#37474F' }}>
              Showing <span className="font-semibold">{filteredAndSortedRecords.length}</span> of <span className="font-semibold">{records.length}</span> records
            </div>
          </div>

          {/* Charts and Records - keeping existing code */}
          {/* ... (rest of the entries tab content from original UserDashboard.js) ... */}
          
          <div className="rounded-xl shadow-lg p-4 sm:p-6" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.1)' }}>
            <h2 className="text-2xl font-bold mb-4 sm:mb-6" style={{ color: '#37474F' }}>Your Records</h2>
            <div className="overflow-x-auto">
              {filteredAndSortedRecords.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="text-6xl sm:text-7xl mb-4">📊</div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: '#37474F' }}>No records found</h3>
                  <p className="mb-6 text-sm sm:text-base" style={{ color: '#37474F', opacity: 0.8 }}>
                    {records.length === 0 
                      ? "Add your first electricity entry to get started!"
                      : "Try adjusting your filters to see more results."
                    }
                  </p>
                  {records.length === 0 && (
                    <button 
                      onClick={() => setOpen(true)} 
                      className="text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
                    >
                        Add First Entry
                      </button>
                  )}
                    </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <table className="hidden lg:table w-full">
                    <thead>
                      <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid rgba(55, 71, 79, 0.2)' }}>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Previous</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Current</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Units</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Bill Image</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody style={{ borderTop: '1px solid rgba(55, 71, 79, 0.2)' }}>
                      {filteredAndSortedRecords.map((r) => (
                        <tr key={r._id} style={{ borderBottom: '1px solid rgba(55, 71, 79, 0.1)' }} className="hover:opacity-80 transition-opacity">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium" style={{ color: '#37474F' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                              <div className="text-xs" style={{ color: '#37474F', opacity: 0.6 }}>{new Date(r.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#37474F' }}>{r.customer?.name || 'Self'}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#37474F' }}>{r.previousReading}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#37474F' }}>{r.currentReading}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#B3E5FC', color: '#37474F' }}>
                              {r.unitsConsumed} units
                            </span>
                    </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#81C784', color: '#F5F5F5' }}>
                              ₹{r.totalAmount.toFixed(2)}
                            </span>
                    </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize" style={
                              r.paymentStatus === 'paid' ? { backgroundColor: '#81C784', color: '#F5F5F5' } :
                              r.paymentStatus === 'pending' ? { backgroundColor: '#FFE082', color: '#37474F' } :
                              { backgroundColor: '#EF5350', color: '#F5F5F5' }
                            }>
                        {r.paymentStatus}
                      </span>
                    </td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#37474F' }}>
                            {r.dueDate ? (
                              <div>
                                <div>{new Date(r.dueDate).toLocaleDateString()}</div>
                                {new Date(r.dueDate) < new Date() && r.paymentStatus !== 'paid' && (
                                  <div className="text-xs text-red-600 mt-1">Overdue</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                      {r.billImage ? (
                        <button 
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                                style={{ backgroundColor: '#F5F5F5', color: '#37474F' }}
                          onClick={() => openImageModal(r.billImage, new Date(r.createdAt).toLocaleDateString())}
                        >
                                📷 View
                        </button>
                      ) : (
                              <span className="text-gray-400 text-sm">No image</span>
                      )}
                    </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                              className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:shadow-md transition-all flex items-center gap-1"
                              style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}
                              onClick={() => setEditModal({ open: true, record: r })}
                            >
                              ✏️ Edit
                            </button>
                            {r.paymentStatus === 'paid' ? (
                              <button
                                className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:shadow-md transition-all flex items-center gap-1"
                                style={{ background: 'linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)' }}
                                onClick={() => updatePaymentStatus(r._id, 'unpaid')}
                              >
                                ⏳ Unpaid
                              </button>
                            ) : (
                              <button
                                className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:shadow-md transition-all flex items-center gap-1"
                                style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
                                onClick={() => updatePaymentStatus(r._id, 'paid')}
                              >
                                ✅ Paid
                              </button>
                            )}
                            </div>
                    </td>
                  </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                    {filteredAndSortedRecords.map((r) => (
                      <div key={r._id} className="rounded-xl p-4" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.2)' }}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold" style={{ color: '#37474F' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs" style={{ color: '#37474F', opacity: 0.6 }}>{new Date(r.createdAt).toLocaleTimeString()}</div>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize" style={
                            r.paymentStatus === 'paid' ? { backgroundColor: '#81C784', color: '#F5F5F5' } :
                            r.paymentStatus === 'pending' ? { backgroundColor: '#FFE082', color: '#37474F' } :
                            { backgroundColor: '#EF5350', color: '#F5F5F5' }
                          }>
                            {r.paymentStatus}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                          <div>
                            <span style={{ color: '#37474F', opacity: 0.7 }}>Customer:</span>
                            <span className="ml-2 font-medium" style={{ color: '#37474F' }}>{r.customer?.name || 'Self'}</span>
                          </div>
                          <div>
                            <span style={{ color: '#37474F', opacity: 0.7 }}>Amount:</span>
                            <span className="ml-2 font-semibold" style={{ color: '#4CAF50' }}>₹{r.totalAmount.toFixed(2)}</span>
                          </div>
                          <div>
                            <span style={{ color: '#37474F', opacity: 0.7 }}>Units:</span>
                            <span className="ml-2 font-medium" style={{ color: '#37474F' }}>{r.unitsConsumed}</span>
                          </div>
                          <div>
                            <span style={{ color: '#37474F', opacity: 0.7 }}>Reading:</span>
                            <span className="ml-2 font-medium" style={{ color: '#37474F' }}>{r.previousReading} → {r.currentReading}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                            style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}
                            onClick={() => setEditModal({ open: true, record: r })}
                          >
                            ✏️ Edit
                          </button>
                          {r.paymentStatus === 'paid' ? (
                            <button
                              className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                              style={{ background: 'linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)' }}
                              onClick={() => updatePaymentStatus(r._id, 'unpaid')}
                            >
                              ⏳ Unpaid
                            </button>
                          ) : (
                            <button
                              className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                              style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
                              onClick={() => updatePaymentStatus(r._id, 'paid')}
                            >
                              ✅ Paid
                            </button>
                          )}
                          {r.billImage && (
                            <button 
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                              style={{ backgroundColor: '#F5F5F5', color: '#37474F', border: '1px solid rgba(55, 71, 79, 0.2)' }}
                              onClick={() => openImageModal(r.billImage, new Date(r.createdAt).toLocaleDateString())}
                            >
                              📷 View
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : activeTab === 'customers' ? (
        <>
          <div className="flex justify-end mb-6">
            <button 
              className="text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
              onClick={() => setCustomerModal({ open: true, customer: null })}
            >
              ➕ Add Customer
            </button>
          </div>

          <div className="rounded-xl shadow-lg p-4 sm:p-6" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.1)' }}>
            <h2 className="text-2xl font-bold mb-4 sm:mb-6" style={{ color: '#37474F' }}>Your Customers</h2>
            {customers.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-6xl sm:text-7xl mb-4">👥</div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">No customers yet</h3>
                <p className="mb-6 text-sm sm:text-base" style={{ color: '#37474F', opacity: 0.8 }}>Add your first customer to start tracking their electricity records!</p>
                <button 
                  onClick={() => setCustomerModal({ open: true, customer: null })} 
                  className="bg-gradient-success text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Add First Customer
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="hidden lg:table w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid rgba(55, 71, 79, 0.2)' }}>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Meter Number</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Address</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#37474F' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: '1px solid rgba(55, 71, 79, 0.2)' }}>
                    {customers.map((customer) => (
                      <tr key={customer._id} style={{ borderBottom: '1px solid rgba(55, 71, 79, 0.1)' }} className="hover:opacity-80 transition-opacity">
                        <td className="px-4 py-3 font-semibold" style={{ color: '#37474F' }}>{customer.name}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#37474F' }}>{customer.meterNumber}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#37474F' }}>{customer.phone}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#37474F' }}>{customer.email || '-'}</td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate" style={{ color: '#37474F' }} title={customer.address}>
                          {customer.address}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:shadow-md transition-all flex items-center gap-1"
                              style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}
                              onClick={() => setCustomerModal({ open: true, customer })}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:shadow-md transition-all flex items-center gap-1"
                              style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}
                              onClick={() => setShareModal({ open: true, customer })}
                            >
                              📤 Share
                            </button>
                            <button
                              className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:shadow-md transition-all flex items-center gap-1"
                              style={{ background: 'linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)' }}
                              onClick={() => deleteCustomer(customer._id)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
                <div className="lg:hidden space-y-4">
                  {customers.map((customer) => (
                    <div key={customer._id} className="rounded-xl p-4" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.2)' }}>
                      <div className="font-semibold text-lg mb-3" style={{ color: '#37474F' }}>{customer.name}</div>
                      <div className="space-y-2 text-sm mb-4">
                        <div><span style={{ color: '#37474F', opacity: 0.7 }}>Meter:</span> <span className="font-medium" style={{ color: '#37474F' }}>{customer.meterNumber}</span></div>
                        <div><span style={{ color: '#37474F', opacity: 0.7 }}>Phone:</span> <span className="font-medium" style={{ color: '#37474F' }}>{customer.phone}</span></div>
                        <div><span style={{ color: '#37474F', opacity: 0.7 }}>Email:</span> <span className="font-medium" style={{ color: '#37474F' }}>{customer.email || '-'}</span></div>
                        <div><span style={{ color: '#37474F', opacity: 0.7 }}>Address:</span> <span className="font-medium" style={{ color: '#37474F' }}>{customer.address}</span></div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                          style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}
                          onClick={() => setCustomerModal({ open: true, customer })}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                          style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}
                          onClick={() => setShareModal({ open: true, customer })}
                        >
                          📤 Share
                        </button>
                        <button
                          className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                          style={{ background: 'linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)' }}
                          onClick={() => deleteCustomer(customer._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
        </div>
      </div>
            )}
          </div>
        </>
      ) : activeTab === 'payments' ? (
        <>
          <div className="rounded-xl shadow-lg p-4 sm:p-6" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.1)' }}>
            <h2 className="text-2xl font-bold mb-4 sm:mb-6" style={{ color: '#37474F' }}>💳 Payment Requests</h2>
            <p className="mb-6 text-sm sm:text-base" style={{ color: '#37474F', opacity: 0.8 }}>
              Review and approve payment screenshots submitted by your customers.
            </p>

            {paymentsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#87CEEB' }}></div>
                <p style={{ color: '#37474F', opacity: 0.7 }}>Loading payment requests...</p>
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-6xl sm:text-7xl mb-4">💳</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: '#37474F' }}>No Pending Payments</h3>
                <p className="mb-6 text-sm sm:text-base" style={{ color: '#37474F', opacity: 0.8 }}>
                  All payment requests have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((payment) => {
                  const apiUrl = process.env.NODE_ENV === 'production' 
                    ? (process.env.REACT_APP_API_URL || '') 
                    : 'http://localhost:5000';
                  const imageUrl = payment.paymentScreenshot?.startsWith('http') 
                    ? payment.paymentScreenshot 
                    : `${apiUrl}${payment.paymentScreenshot}`;
                  
                  return (
                    <div 
                      key={payment._id} 
                      className="rounded-xl p-4 sm:p-6 shadow-lg border" 
                      style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(55, 71, 79, 0.2)' }}
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Payment Image */}
                        <div className="flex-shrink-0">
                          <div 
                            className="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ width: '150px', height: '150px', backgroundColor: '#F5F5F5' }}
                            onClick={() => {
                              setImageModal({ 
                                open: true, 
                                imageUrl: imageUrl,
                                imageAlt: `Payment screenshot for ${payment.customer?.name || 'Customer'}` 
                              });
                            }}
                          >
                            <img 
                              src={imageUrl} 
                              alt="Payment screenshot"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                            <div 
                              className="w-full h-full items-center justify-center text-4xl"
                              style={{ display: 'none', backgroundColor: '#F5F5F5' }}
                            >
                              📷
                            </div>
                          </div>
                        </div>

                        {/* Payment Details */}
                        <div className="flex-1">
                          <div className="mb-4">
                            <h3 className="text-lg font-bold mb-2" style={{ color: '#37474F' }}>
                              {payment.customer?.name || 'Self'}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span style={{ color: '#37474F', opacity: 0.7 }}>Meter Number:</span>
                                <span className="ml-2 font-medium" style={{ color: '#37474F' }}>
                                  {payment.customer?.meterNumber || payment.meterNumber}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: '#37474F', opacity: 0.7 }}>Phone:</span>
                                <span className="ml-2 font-medium" style={{ color: '#37474F' }}>
                                  {payment.customer?.phone || '-'}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: '#37474F', opacity: 0.7 }}>Amount:</span>
                                <span className="ml-2 font-semibold" style={{ color: '#4CAF50' }}>
                                  ₹{payment.totalAmount?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: '#37474F', opacity: 0.7 }}>Submitted:</span>
                                <span className="ml-2 font-medium" style={{ color: '#37474F' }}>
                                  {payment.paymentSubmittedAt 
                                    ? new Date(payment.paymentSubmittedAt).toLocaleString()
                                    : '-'}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: '#37474F', opacity: 0.7 }}>Record Date:</span>
                                <span className="ml-2 font-medium" style={{ color: '#37474F' }}>
                                  {new Date(payment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: '#37474F', opacity: 0.7 }}>Status:</span>
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize" style={
                                  payment.paymentStatus === 'paid' ? { backgroundColor: '#81C784', color: '#F5F5F5' } :
                                  payment.paymentStatus === 'pending' ? { backgroundColor: '#FFE082', color: '#37474F' } :
                                  { backgroundColor: '#EF5350', color: '#F5F5F5' }
                                }>
                                  {payment.paymentStatus}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => handleApprovePayment(payment._id)}
                              className="px-4 py-2 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
                              style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)', color: 'white' }}
                            >
                              ✅ Approve Payment
                            </button>
                            <button
                              onClick={() => handleRejectPayment(payment._id)}
                              className="px-4 py-2 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
                              style={{ background: 'linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)', color: '#37474F' }}
                            >
                              ❌ Reject Payment
                            </button>
                            <button
                              onClick={() => {
                                setImageModal({ 
                                  open: true, 
                                  imageUrl: imageUrl,
                                  imageAlt: `Payment screenshot for ${payment.customer?.name || 'Customer'}` 
                                });
                              }}
                              className="px-4 py-2 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
                              style={{ backgroundColor: '#F5F5F5', color: '#37474F', border: '1px solid rgba(55, 71, 79, 0.2)' }}
                            >
                              👁️ View Image
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : activeTab === 'settings' ? (
        <>
          <div className="rounded-xl shadow-lg p-6 sm:p-8" style={{ backgroundColor: '#F5F5F5', border: '1px solid rgba(55, 71, 79, 0.1)' }}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: '#37474F' }}>💳 Payment Settings</h2>
            <p className="mb-6 text-sm sm:text-base" style={{ color: '#37474F', opacity: 0.8 }}>
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
              <div className="mb-6">
                <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">💳</span>
                  <input
                    id="upiId"
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g., yourname@paytm, yourname@ybl, yourname@okaxis"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-base"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 ml-0 sm:ml-11">
                  Enter your UPI ID (e.g., yourname@paytm, yourname@ybl, yourname@okaxis)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
                <button
                  type="button"
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
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
                  className="text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}
                  disabled={settingsLoading}
                >
                  {settingsLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save UPI ID</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {upiId && (
              <div className="mt-6 p-5 sm:p-6 rounded-xl text-white text-center" style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)' }}>
                <div className="text-sm mb-2 opacity-90">Your Current UPI ID:</div>
                <div className="text-xl sm:text-2xl font-bold break-all mb-4">
                  {upiId}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(upiId);
                    toast.success('UPI ID copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm font-medium hover:bg-white/30 transition-colors"
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

      {/* Image Modal */}
      {imageModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={closeImageModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(55, 71, 79, 0.2)' }}>
              <h3 className="text-xl font-bold" style={{ color: '#37474F' }}>
                {imageModal.imageAlt?.includes('Payment') ? 'Payment Screenshot' : 'Bill Image'}
              </h3>
              <button 
                className="text-2xl font-bold hover:opacity-70 transition-opacity" 
                style={{ color: '#37474F' }}
                onClick={closeImageModal}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {imageLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#87CEEB' }}></div>
                  <p style={{ color: '#37474F', opacity: 0.7 }}>Loading image...</p>
                </div>
              )}
              <img 
                src={imageModal.imageUrl} 
                alt={imageModal.imageAlt || 'Image'}
                className="w-full h-auto rounded-lg"
                style={{ display: imageLoading ? 'none' : 'block' }}
                crossOrigin="anonymous"
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  setImageLoading(false);
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="hidden flex-col items-center justify-center py-12 text-center" style={{ color: '#37474F' }}>
                <p className="text-lg font-semibold mb-2">Image could not be loaded</p>
                <p className="text-sm opacity-70">Please check if the image file exists and is accessible.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: 'rgba(55, 71, 79, 0.2)' }}>
              <button 
                className="px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: '#F5F5F5', color: '#37474F', border: '1px solid rgba(55, 71, 79, 0.2)' }}
                onClick={closeImageModal}
              >
                Close
              </button>
              <button 
                className="px-4 py-2 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #64B5F6 100%)' }}
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
    </div>
  );
} 
