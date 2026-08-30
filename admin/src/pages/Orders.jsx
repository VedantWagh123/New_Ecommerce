import React, { useEffect, useState, useMemo, useContext } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { ALL_STATUSES, ORDER_STATUS, getStatusBadgeStyle } from '../utils/orderStatus';
import AdminOrderModal from '../components/AdminOrderModal';
import { SocketContext } from '../context/SocketContext';

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [wishmasters, setWishmasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('LATEST');
  const [mainView, setMainView] = useState('CUSTOMERS'); // 'CUSTOMERS' (default) | 'ALL_ORDERS'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid' for ALL_ORDERS view
  const [expandedCustomers, setExpandedCustomers] = useState({});
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const deleteOrderHandler = async (orderId) => {
    try {
      const response = await axios.post(
        backendUrl + '/api/order/delete',
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(response.data.message || 'Order deleted successfully');
        setOrders(prev => prev.filter(ord => ord._id !== orderId));
        if (selectedOrderDetails && selectedOrderDetails._id === orderId) {
          setSelectedOrderDetails(null);
        }
        setOrderToDelete(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error deleting order');
    }
  };

  const cancelActionHandler = async (orderId, action) => {
    try {
      const url = action === 'approve' ? '/api/order/cancel/approve' : '/api/order/cancel/reject';
      const response = await axios.post(
        backendUrl + url,
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error processing cancellation');
    }
  };

  const fetchAllOrders = async () => {
    if (!token) return;
    try {
      const response = await axios.post(
        backendUrl + '/api/order/list',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setOrders(response.data.orders.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const statusHandler = async (orderId, newStatus, note = '') => {
    try {
      const response = await axios.post(
        backendUrl + '/api/order/status',
        { orderId, status: newStatus, note, updatedBy: 'Admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrders(prev => prev.map(ord => ord._id === orderId ? { ...ord, status: newStatus } : ord));
        if (selectedOrderDetails && selectedOrderDetails._id === orderId) {
          setSelectedOrderDetails(prev => ({ ...prev, status: newStatus }));
        }
        fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error updating status');
    }
  };

  const fetchWishmasters = async () => {
    if (!token) return;
    try {
      const response = await axios.get(
        backendUrl + '/api/user/delivery-partners',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        // Only keep approved Wishmasters
        setWishmasters(response.data.partners.filter(p => p.deliveryStatus === 'approved'));
      }
    } catch (error) {
      console.error("Error fetching Wishmasters:", error);
    }
  };

  const assignWishmasterHandler = async (orderId, partnerId) => {
    try {
      const response = await axios.post(
        backendUrl + '/api/order/assign-wishmaster',
        { orderId, partnerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchAllOrders();
        setSelectedOrderDetails(response.data.order);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error assigning wishmaster');
    }
  };

  const handleCopyId = (id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`Copied Order ID #${id.slice(-8).toUpperCase()}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCustomerExpand = (customerId) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  const { socket } = useContext(SocketContext);

  useEffect(() => {
    if (socket) {
      const handleOrderUpdate = () => fetchAllOrders();
      const handleWishmasterUpdate = () => fetchWishmasters();
      
      socket.on('connect', handleOrderUpdate);
      socket.on('order-updated', handleOrderUpdate);
      socket.on('wishmaster-updated', handleWishmasterUpdate);
      
      return () => {
        socket.off('connect', handleOrderUpdate);
        socket.off('order-updated', handleOrderUpdate);
        socket.off('wishmaster-updated', handleWishmasterUpdate);
      };
    }
  }, [socket, token]);

  useEffect(() => {
    fetchAllOrders();
    fetchWishmasters();
  }, [token]);

  // Group orders by unique customer
  const customerGroups = useMemo(() => {
    const map = {};
    orders.forEach(order => {
      const email = order.address?.email ? order.address.email.toLowerCase().trim() : '';
      const phone = order.address?.phone ? order.address.phone.trim() : '';
      const userId = order.userId ? String(order.userId).trim() : '';
      
      // Preferred unique key: userId -> email -> phone -> guest
      const key = userId || email || phone || `guest_${order._id}`;

      if (!map[key]) {
        const firstName = order.address?.firstName || 'Guest';
        const lastName = order.address?.lastName || 'User';
        
        map[key] = {
          id: key,
          name: order.userProfileName || `${firstName} ${lastName}`.trim(),
          email: order.userProfileEmail || order.address?.email || 'No email provided',
          phone: order.address?.phone || 'No phone provided',
          address: order.address || {},
          karmaScore: order.karmaScore !== undefined ? order.karmaScore : 100,
          orders: []
        };
      }
      map[key].orders.push(order);
    });

    // Compute metrics for each customer
    return Object.values(map).map(cust => {
      const totalOrders = cust.orders.length;
      const totalSpending = cust.orders
        .filter(o => o.status !== ORDER_STATUS.CANCELLED && o.status !== ORDER_STATUS.DELIVERY_FAILED)
        .reduce((sum, o) => sum + (o.amount || 0), 0);

      const activeOrders = cust.orders.filter(o => 
        o.status !== ORDER_STATUS.DELIVERED && 
        o.status !== ORDER_STATUS.CANCELLED && 
        o.status !== ORDER_STATUS.RETURNED &&
        o.status !== ORDER_STATUS.DELIVERY_FAILED
      ).length;

      // Sort customer's orders by date latest first
      const sortedOrders = [...cust.orders].sort((a, b) => (b.date || 0) - (a.date || 0));

      return {
        ...cust,
        orders: sortedOrders,
        totalOrders,
        totalSpending,
        activeOrders
      };
    });
  }, [orders]);

  // Derived Metrics & Statistics
  const totalOrdersCount = orders.length;
  const packingCount = orders.filter(o => (o.status || 'Packing') === ORDER_STATUS.PACKING || o.status === 'Order Placed').length;
  const shippedCount = orders.filter(o => o.status === ORDER_STATUS.SHIPPED).length;
  const outForDeliveryCount = orders.filter(o => o.status === ORDER_STATUS.OUT_FOR_DELIVERY).length;
  const deliveredCount = orders.filter(o => o.status === ORDER_STATUS.DELIVERED).length;
  const cancelledCount = orders.filter(o => o.status === ORDER_STATUS.CANCELLED || o.status === ORDER_STATUS.DELIVERY_FAILED).length;
  const cancelRequestsCount = orders.filter(o => o.cancelStatus === 'Requested').length;

  const totalRevenue = orders
    .filter(o => o.status !== ORDER_STATUS.CANCELLED && o.status !== ORDER_STATUS.DELIVERY_FAILED)
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const statusCounts = {
    ALL: totalOrdersCount,
    [ORDER_STATUS.PACKING]: packingCount,
    [ORDER_STATUS.SHIPPED]: shippedCount,
    [ORDER_STATUS.OUT_FOR_DELIVERY]: outForDeliveryCount,
    [ORDER_STATUS.DELIVERED]: deliveredCount,
    [ORDER_STATUS.CANCELLED]: cancelledCount
  };

  // Filtered Customers List
  const filteredCustomers = useMemo(() => {
    return customerGroups.filter(cust => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = cust.name.toLowerCase().includes(search) ||
                            cust.email.toLowerCase().includes(search) ||
                            cust.phone.toLowerCase().includes(search) ||
                            cust.orders.some(o => (o._id || '').toLowerCase().includes(search));

      const matchesStatus = statusFilter === 'ALL' 
                            ? true 
                            : statusFilter === 'CANCEL_REQUEST'
                                ? cust.orders.some(o => o.cancelStatus === 'Requested')
                                : cust.orders.some(o => (o.status || 'Packing') === statusFilter);
      const matchesPayment = paymentFilter === 'ALL' || cust.orders.some(o => (o.paymentMethod || '').toLowerCase() === paymentFilter.toLowerCase());
      const matchesPaymentStatus = paymentStatusFilter === 'ALL' || cust.orders.some(o => paymentStatusFilter === 'PAID' ? o.payment : !o.payment);

      return matchesSearch && matchesStatus && matchesPayment && matchesPaymentStatus;
    }).sort((a, b) => {
      if (sortBy === 'LATEST') {
        const latestA = a.orders[0]?.date || 0;
        const latestB = b.orders[0]?.date || 0;
        return latestB - latestA;
      }
      if (sortBy === 'HIGH_AMOUNT') return b.totalSpending - a.totalSpending;
      return b.totalOrders - a.totalOrders;
    });
  }, [customerGroups, searchTerm, statusFilter, paymentFilter, paymentStatusFilter, sortBy]);

  // Filtered All Orders List (for ALL_ORDERS view)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderIdStr = (order._id || '').toLowerCase();
      const custName = `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.toLowerCase();
      const phoneStr = (order.address?.phone || '').toLowerCase();
      const searchMatches = orderIdStr.includes(searchTerm.toLowerCase()) || 
                            custName.includes(searchTerm.toLowerCase()) || 
                            phoneStr.includes(searchTerm.toLowerCase());

      const orderStatus = order.status || 'Packing';
      const statusMatches = statusFilter === 'ALL' 
                            ? true
                            : statusFilter === 'CANCEL_REQUEST'
                                ? order.cancelStatus === 'Requested'
                                : orderStatus === statusFilter;
      const paymentMatches = paymentFilter === 'ALL' || (order.paymentMethod || '').toLowerCase() === paymentFilter.toLowerCase();
      const paymentStatusMatches = paymentStatusFilter === 'ALL' || 
                                   (paymentStatusFilter === 'PAID' ? order.payment : !order.payment);

      return searchMatches && statusMatches && paymentMatches && paymentStatusMatches;
    }).sort((a, b) => {
      if (sortBy === 'LATEST') return (b.date || 0) - (a.date || 0);
      if (sortBy === 'OLDEST') return (a.date || 0) - (b.date || 0);
      if (sortBy === 'HIGH_AMOUNT') return (b.amount || 0) - (a.amount || 0);
      return 0;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, paymentStatusFilter, sortBy]);

  return (
    <div className='w-full pb-20'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs'>
        <div>
          <div className='flex items-center gap-3 flex-wrap'>
            <h2 className='text-2xl sm:text-3xl font-black text-gray-900 tracking-tight'>Order Fulfillment Hub</h2>
            <span className='px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5'>
              <span className='w-2 h-2 rounded-full bg-emerald-500 animate-ping' />
              Live Sync
            </span>
          </div>
          <p className='text-xs sm:text-sm text-gray-500 mt-1 font-medium'>
            Customer-wise order breakdown, dispatch updates, and tracking audit logs
          </p>
        </div>

        <button
          onClick={fetchAllOrders}
          className='bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs hover:shadow flex items-center gap-2 active:scale-95 cursor-pointer self-start sm:self-auto'
        >
          <svg className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Orders
        </button>
      </div>

      <div className='flex items-center justify-between gap-4 mb-6 bg-gray-100 p-1.5 rounded-2xl border border-gray-200/90 max-w-md'>
        <button
          onClick={() => setMainView('CUSTOMERS')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            mainView === 'CUSTOMERS'
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-600 hover:text-black hover:bg-white/50'
          }`}
        >
          <span>👥</span> Customers View ({customerGroups.length})
        </button>

        <button
          onClick={() => setMainView('ALL_ORDERS')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            mainView === 'ALL_ORDERS'
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-600 hover:text-black hover:bg-white/50'
          }`}
        >
          <span>📋</span> All Orders ({orders.length})
        </button>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8'>
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-black text-white border-black shadow-md'
              : 'bg-white text-gray-900 border-gray-200 shadow-2xs hover:shadow hover:-translate-y-0.5'
          }`}
        >
          <div className='flex items-center justify-between'>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${statusFilter === 'ALL' ? 'text-gray-300' : 'text-gray-400'}`}>Total Orders</p>
            <span className='text-xs'>📦</span>
          </div>
          <p className='text-2xl font-black mt-2'>{totalOrdersCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter(ORDER_STATUS.PACKING)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === ORDER_STATUS.PACKING
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-blue-50/60 text-blue-900 border-blue-100 shadow-2xs hover:shadow hover:-translate-y-0.5'
          }`}
        >
          <div className='flex items-center justify-between'>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${statusFilter === ORDER_STATUS.PACKING ? 'text-blue-100' : 'text-blue-700'}`}>Packing</p>
            <span className='text-xs'>⏳</span>
          </div>
          <p className='text-2xl font-black mt-2'>{packingCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter(ORDER_STATUS.SHIPPED)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === ORDER_STATUS.SHIPPED
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-indigo-50/60 text-indigo-900 border-indigo-100 shadow-2xs hover:shadow hover:-translate-y-0.5'
          }`}
        >
          <div className='flex items-center justify-between'>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${statusFilter === ORDER_STATUS.SHIPPED ? 'text-indigo-100' : 'text-indigo-700'}`}>Shipped</p>
            <span className='text-xs'>🚚</span>
          </div>
          <p className='text-2xl font-black mt-2'>{shippedCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter(ORDER_STATUS.OUT_FOR_DELIVERY)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === ORDER_STATUS.OUT_FOR_DELIVERY
              ? 'bg-amber-500 text-white border-amber-500 shadow-md'
              : 'bg-amber-50/60 text-amber-900 border-amber-100 shadow-2xs hover:shadow hover:-translate-y-0.5'
          }`}
        >
          <div className='flex items-center justify-between'>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${statusFilter === ORDER_STATUS.OUT_FOR_DELIVERY ? 'text-amber-100' : 'text-amber-700'}`}>Out Delivery</p>
            <span className='text-xs'>🛵</span>
          </div>
          <p className='text-2xl font-black mt-2'>{outForDeliveryCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter(ORDER_STATUS.DELIVERED)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === ORDER_STATUS.DELIVERED
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-emerald-50/60 text-emerald-900 border-emerald-100 shadow-2xs hover:shadow hover:-translate-y-0.5'
          }`}
        >
          <div className='flex items-center justify-between'>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${statusFilter === ORDER_STATUS.DELIVERED ? 'text-emerald-100' : 'text-emerald-700'}`}>Delivered</p>
            <span className='text-xs'>✅</span>
          </div>
          <p className='text-2xl font-black mt-2'>{deliveredCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter(ORDER_STATUS.CANCELLED)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === ORDER_STATUS.CANCELLED
              ? 'bg-rose-600 text-white border-rose-600 shadow-md'
              : 'bg-rose-50/60 text-rose-900 border-rose-100 shadow-2xs hover:shadow hover:-translate-y-0.5'
          }`}
        >
          <div className='flex items-center justify-between'>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${statusFilter === ORDER_STATUS.CANCELLED ? 'text-rose-100' : 'text-rose-700'}`}>Cancelled</p>
            <span className='text-xs'>🚫</span>
          </div>
          <p className='text-2xl font-black mt-2'>{cancelledCount}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('CANCEL_REQUEST')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'CANCEL_REQUEST'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-amber-50/60 text-amber-900 border-amber-100 shadow-2xs hover:shadow hover:-translate-y-0.5'
          }`}
        >
          <div className='flex items-center justify-between'>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${statusFilter === 'CANCEL_REQUEST' ? 'text-amber-100' : 'text-amber-700'}`}>Cancel Req.</p>
            <span className='text-xs'>⏳</span>
          </div>
          <p className='text-2xl font-black mt-2'>{cancelRequestsCount}</p>
        </div>

        <div className='bg-gray-900 text-white p-4 rounded-2xl border border-gray-800 shadow-md hover:-translate-y-0.5 transition-all col-span-2 sm:col-span-1'>
          <div className='flex items-center justify-between'>
            <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>Revenue</p>
            <span className='text-xs'>💰</span>
          </div>
          <p className='text-xl font-black text-emerald-400 mt-2'>{currency}{totalRevenue.toFixed(0)}</p>
        </div>
      </div>

      <div className='bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs mb-8 space-y-4'>
        <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
          <div className='relative w-full md:w-96'>
            <input
              type='text'
              placeholder='Search Customer Name, Email, Phone, Order ID...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full border border-gray-300 rounded-2xl py-2.5 px-4 pl-10 pr-9 text-xs focus:ring-2 focus:ring-black focus:outline-none bg-white font-medium'
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-black text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className='flex items-center gap-3 w-full md:w-auto flex-wrap justify-between sm:justify-end'>
            {mainView === 'ALL_ORDERS' && (
              <div className='flex bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0 text-xs font-bold'>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <span>☰</span> Table
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <span>::</span> Cards
                </button>
              </div>
            )}

            <div className='flex items-center gap-2 text-xs text-gray-500 flex-wrap'>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className='border border-gray-300 rounded-xl p-2.5 text-xs font-semibold bg-white cursor-pointer'
              >
                <option value='ALL'>All Payment Methods</option>
                <option value='COD'>Cash on Delivery</option>
                <option value='Stripe'>Stripe</option>
                <option value='Razorpay'>Razorpay</option>
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className='border border-gray-300 rounded-xl p-2.5 text-xs font-semibold bg-white cursor-pointer'
              >
                <option value='ALL'>All Payment Statuses</option>
                <option value='PAID'>Paid Only</option>
                <option value='PENDING'>Pending Only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className='border border-gray-300 rounded-xl p-2.5 text-xs font-semibold bg-white cursor-pointer'
              >
                <option value='LATEST'>Sort: Latest First</option>
                <option value='HIGH_AMOUNT'>Sort: Highest Spending</option>
                <option value='MOST_ORDERS'>Sort: Most Orders</option>
              </select>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2 overflow-x-auto pt-3 border-t border-gray-100 text-xs font-semibold'>
          <span className='text-gray-400 mr-1 text-[11px] uppercase tracking-wider shrink-0'>Filter Status:</span>
          {['ALL', ...ALL_STATUSES].map((st) => {
            const cnt = statusCounts[st] !== undefined ? statusCounts[st] : orders.filter(o => o.status === st).length;
            const isSelected = statusFilter === st;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-black text-white shadow-xs' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{st === 'ALL' ? 'All Statuses' : st}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className='flex flex-col gap-4'>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className='h-28 bg-gray-100 animate-pulse rounded-3xl' />
          ))}
        </div>
      ) : mainView === 'CUSTOMERS' ? (
        filteredCustomers.length === 0 ? (
          <div className='p-16 text-center bg-white border border-gray-200 rounded-3xl space-y-4 shadow-xs'>
            <div className='w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-2xl text-gray-400'>
              👥
            </div>
            <h3 className='text-lg font-bold text-gray-900'>No customers found matching filters</h3>
            <p className='text-xs text-gray-500 max-w-md mx-auto leading-relaxed'>
              We couldn't find any customers matching your search keyword or selected status.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setPaymentFilter('ALL');
                setPaymentStatusFilter('ALL');
              }}
              className='bg-black hover:bg-gray-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-xs'
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredCustomers.map((cust) => {
              const isExpanded = Boolean(expandedCustomers[cust.id]);

              return (
                <div 
                  key={cust.id} 
                  className='bg-white border border-gray-200/90 rounded-3xl shadow-xs overflow-hidden transition-all duration-300 hover:border-gray-300'
                >
                  <div 
                    onClick={() => toggleCustomerExpand(cust.id)}
                    className='p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/70 transition-colors'
                  >
                    <div className='flex items-start sm:items-center gap-3.5'>
                      <div className='w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs'>
                        {cust.name?.[0]?.toUpperCase() || 'C'}
                      </div>

                      <div>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <h3 className='text-base sm:text-lg font-bold text-gray-900'>{cust.name}</h3>
                          {cust.activeOrders > 0 && (
                            <span className='px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200'>
                              {cust.activeOrders} Active {cust.activeOrders === 1 ? 'Order' : 'Orders'}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 shadow-xs ${cust.karmaScore < 40 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                              🛡️ Karma: {cust.karmaScore}/100
                          </span>
                        </div>

                        <div className='flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap font-medium'>
                          <span>📧 {cust.email}</span>
                          <span>📞 {cust.phone}</span>
                          {cust.address?.city && <span>📍 {cust.address.city}, {cust.address.country}</span>}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100'>
                      <div className='flex items-center gap-2 text-xs'>
                        <div className='bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-800 text-center'>
                          <p className='text-[10px] text-gray-500 uppercase font-bold'>Orders</p>
                          <p className='font-black text-sm text-gray-900'>{cust.totalOrders}</p>
                        </div>

                        <div className='bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-emerald-900 text-center'>
                          <p className='text-[10px] text-emerald-700 uppercase font-bold'>Spent</p>
                          <p className='font-black text-sm text-emerald-800'>{currency}{cust.totalSpending.toFixed(2)}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCustomerExpand(cust.id);
                        }}
                        className='bg-gray-100 hover:bg-black hover:text-white text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs'
                      >
                        <span>{isExpanded ? 'Hide Orders' : 'View Orders'} ({cust.orders.length})</span>
                        <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className='border-t border-gray-100 bg-gray-50/50 p-4 sm:p-6 animate-fade-in space-y-3'>
                      <p className='text-xs font-bold text-gray-500 uppercase tracking-wider mb-2'>
                        Purchased Order History ({cust.orders.length})
                      </p>

                      <div className='space-y-3'>
                        {cust.orders.map((order) => {
                          const currentStatus = order.status || ORDER_STATUS.PACKING;
                          const itemsCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                          const shortId = order._id?.slice(-8)?.toUpperCase();

                          return (
                            <div 
                              key={order._id}
                              className='bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all grid grid-cols-1 md:grid-cols-12 gap-3 items-center'
                            >
                              <div className='md:col-span-3 text-xs'>
                                <div className='flex items-center gap-2'>
                                  <span className='font-mono font-bold text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200'>
                                    #{shortId}
                                  </span>
                                  <button
                                    onClick={(e) => handleCopyId(order._id, e)}
                                    className='text-[10px] text-gray-400 hover:text-black font-semibold underline cursor-pointer'
                                    title="Copy full ID"
                                  >
                                    {copiedId === order._id ? 'Copied!' : 'Copy'}
                                  </button>
                                </div>
                                <p className='text-[11px] text-gray-500 mt-1 font-medium'>
                                  {new Date(order.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                              </div>

                              <div className='md:col-span-4 text-xs'>
                                <p className='font-bold text-gray-900 mb-1'>{itemsCount} {itemsCount === 1 ? 'Item' : 'Items'}</p>
                                <div className='flex items-center gap-1.5 overflow-hidden'>
                                  {order.items?.slice(0, 3).map((it, idx) => (
                                    <img
                                      key={idx}
                                      src={it.image?.[0]}
                                      alt={it.name}
                                      className="w-9 h-11 object-cover rounded-lg border border-gray-200 shrink-0 bg-gray-50"
                                      title={`${it.name} x${it.quantity} (${it.size})`}
                                    />
                                  ))}
                                  {order.items?.length > 3 && (
                                    <span className='w-9 h-11 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center font-bold text-[10px] text-blue-600 shrink-0'>
                                      +{order.items.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className='md:col-span-2 text-xs'>
                                <p className='text-sm font-black text-gray-900'>{currency}{order.amount?.toFixed(2)}</p>
                                <div className='flex items-center gap-1 mt-0.5'>
                                  <span className='font-bold text-gray-600 text-[10px] uppercase bg-gray-100 px-1.5 py-0.5 rounded border'>
                                    {order.paymentMethod}
                                  </span>
                                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                    order.payment ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {order.payment ? 'Paid' : 'Pending'}
                                  </span>
                                </div>
                              </div>

                              <div className='md:col-span-3 flex items-center justify-end gap-2'>
                                {order.cancelStatus === 'Requested' ? (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => cancelActionHandler(order._id, 'approve')} className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors">Approve Cancel</button>
                                    <button onClick={() => cancelActionHandler(order._id, 'reject')} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold transition-colors">Reject</button>
                                  </div>
                                ) : ['Packing', 'Accepted'].includes(currentStatus) ? (
                                  <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-bold border border-gray-200 uppercase tracking-wider text-center">
                                    Pending Seller Acceptance
                                  </span>
                                ) : ['Assigned', 'Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(currentStatus) ? (
                                  <div className="flex gap-1.5 items-center">
                                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-bold border border-emerald-200 whitespace-nowrap">
                                      ✅ {currentStatus}
                                    </span>
                                    {currentStatus === 'Delivered' && (
                                      <button onClick={() => statusHandler(order._id, 'Returned')} className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold transition-colors">Return</button>
                                    )}
                                    <button onClick={() => statusHandler(order._id, 'Cancelled')} className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-colors">Cancel</button>
                                  </div>
                                ) : (
                                  <select
                                    value={currentStatus}
                                    onChange={(e) => statusHandler(order._id, e.target.value)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${getStatusBadgeStyle(currentStatus)}`}
                                  >
                                    <option value={currentStatus}>{currentStatus}</option>
                                    {['Packed', 'Ready for Pickup', 'Assigned', 'Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Returned', 'Cancelled']
                                      .slice(['Packed', 'Ready for Pickup', 'Assigned', 'Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Returned', 'Cancelled'].indexOf(currentStatus) + 1)
                                      .map(st => (
                                        <option key={st} value={st}>{st}</option>
                                      ))
                                    }
                                  </select>
                                )}

                                <button
                                  onClick={() => setSelectedOrderDetails(order)}
                                  className='bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5'
                                >
                                  <span>👁️</span> Details
                                </button>

                                <button
                                  onClick={() => setOrderToDelete(order)}
                                  className='bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1'
                                  title="Delete Order Permanently"
                                >
                                  <span>🗑️</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        filteredOrders.length === 0 ? (
          <div className='p-16 text-center bg-white border border-gray-200 rounded-3xl space-y-4 shadow-xs'>
            <div className='w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-2xl text-gray-400'>
              🔍
            </div>
            <h3 className='text-lg font-bold text-gray-900'>No orders found matching filters</h3>
            <p className='text-xs text-gray-500 max-w-md mx-auto leading-relaxed'>
              We couldn't find any orders matching your active search query or status filter.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setPaymentFilter('ALL');
                setPaymentStatusFilter('ALL');
              }}
              className='bg-black hover:bg-gray-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-xs'
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className='bg-white rounded-3xl border border-gray-200/90 shadow-xs overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse text-xs'>
                <thead className='bg-gray-50/90 text-gray-500 uppercase font-bold text-[11px] border-b border-gray-200/80 tracking-wider'>
                  <tr>
                    <th className='p-4 pl-6'>Order & Customer</th>
                    <th className='p-4'>Items Purchased</th>
                    <th className='p-4'>Amount & Payment</th>
                    <th className='p-4'>Fulfillment Status</th>
                    <th className='p-4 text-right pr-6'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 text-gray-800 font-medium'>
                  {filteredOrders.map((order) => {
                    const currentStatus = order.status || ORDER_STATUS.PACKING;
                    const itemsCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                    const shortId = order._id?.slice(-8)?.toUpperCase();

                    return (
                      <tr key={order._id} className='hover:bg-gray-50/80 transition-colors group'>
                        <td className='p-4 pl-6 align-middle'>
                          <div className='flex items-start gap-3'>
                            <div className='w-10 h-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-700 font-bold text-xs group-hover:border-black transition-colors'>
                              {order.address?.firstName?.[0] || 'O'}
                            </div>
                            <div>
                              <div className='flex items-center gap-2'>
                                <span className='font-mono font-bold text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200'>
                                  #{shortId}
                                </span>
                                <button
                                  onClick={(e) => handleCopyId(order._id, e)}
                                  className='text-[10px] text-gray-400 hover:text-black font-semibold underline cursor-pointer'
                                  title="Copy full ID"
                                >
                                  {copiedId === order._id ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                              <div className='flex items-center gap-2 mt-1'>
                                <p className='text-xs sm:text-sm font-bold text-gray-900'>
                                  {order.address?.firstName} {order.address?.lastName}
                                </p>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${order.karmaScore < 40 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                    🛡️ {order.karmaScore}
                                </span>
                              </div>
                              <p className='text-[11px] text-gray-400 line-clamp-1 mt-0.5 font-normal'>
                                {order.address?.email} • 📍 {order.address?.city}
                              </p>
                              <div className='mt-1'>
                                <span className='text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 inline-flex items-center gap-1'>
                                  <span>🏪</span> {[...new Set(order.items?.map(it => it.storeName || 'Veloura Official'))].join(', ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className='p-4 align-middle'>
                          <div>
                            <p className='font-bold text-gray-900 text-xs mb-1'>{itemsCount} {itemsCount === 1 ? 'Item' : 'Items'}</p>
                            <div className='flex items-center gap-1.5 overflow-hidden'>
                              {order.items?.slice(0, 3).map((it, idx) => (
                                <img
                                  key={idx}
                                  src={it.image?.[0]}
                                  alt={it.name}
                                  className="w-9 h-11 object-cover rounded-lg border border-gray-200 shrink-0 bg-gray-50"
                                  title={`${it.name} x${it.quantity} (${it.size})`}
                                />
                              ))}
                              {order.items?.length > 3 && (
                                <span className='w-9 h-11 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center font-bold text-[10px] text-blue-600 shrink-0'>
                                  +{order.items.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className='p-4 align-middle'>
                          <div>
                            <p className='text-sm font-black text-gray-900'>{currency}{order.amount?.toFixed(2)}</p>
                            <div className='flex items-center gap-1.5 mt-1'>
                              <span className='font-bold text-gray-600 text-[10px] uppercase bg-gray-100 px-1.5 py-0.5 rounded border'>
                                {order.paymentMethod}
                              </span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                order.payment ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {order.payment ? 'Paid' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className='p-4 align-middle'>
                          {order.cancelStatus === 'Requested' ? (
                            <div className="flex flex-col gap-1 w-full max-w-[120px]">
                              <span className="text-[10px] font-bold text-rose-600 uppercase">Cancel Requested</span>
                              <div className="flex gap-1">
                                <button onClick={() => cancelActionHandler(order._id, 'approve')} className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-[10px] font-bold flex-1">Approve</button>
                                <button onClick={() => cancelActionHandler(order._id, 'reject')} className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-[10px] font-bold flex-1">Reject</button>
                              </div>
                            </div>
                          ) : ['Packing', 'Accepted'].includes(currentStatus) ? (
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-bold border border-gray-200 uppercase tracking-wider text-center block w-full max-w-[140px]">
                              Pending Seller Acceptance
                            </span>
                          ) : ['Assigned', 'Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(currentStatus) ? (
                            <div className="flex flex-col gap-1 w-full max-w-[140px]">
                              <span className="px-2 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 text-center">
                                ✅ {currentStatus}
                              </span>
                              <div className="flex gap-1">
                                {currentStatus === 'Delivered' && (
                                  <button onClick={() => statusHandler(order._id, 'Returned')} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-bold flex-1 transition-colors">Return</button>
                                )}
                                <button onClick={() => statusHandler(order._id, 'Cancelled')} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold flex-1 transition-colors">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <select
                              value={currentStatus}
                              onChange={(e) => statusHandler(order._id, e.target.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer w-full max-w-[140px] ${getStatusBadgeStyle(currentStatus)}`}
                            >
                              <option value={currentStatus}>{currentStatus}</option>
                              {['Packed', 'Ready for Pickup', 'Assigned', 'Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Returned', 'Cancelled']
                                .slice(['Packed', 'Ready for Pickup', 'Assigned', 'Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Returned', 'Cancelled'].indexOf(currentStatus) + 1)
                                .map(st => (
                                  <option key={st} value={st}>{st}</option>
                                ))
                              }
                            </select>
                          )}
                        </td>

                        <td className='p-4 text-right pr-6 align-middle'>
                          <div className='flex items-center justify-end gap-2'>
                            <button
                              onClick={() => setSelectedOrderDetails(order)}
                              className='bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer'
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => setOrderToDelete(order)}
                              className='bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1'
                              title="Delete Order Permanently"
                            >
                              <span>🗑️ Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
            {filteredOrders.map((order) => {
              const currentStatus = order.status || ORDER_STATUS.PACKING;
              const shortId = order._id?.slice(-8)?.toUpperCase();

              return (
                <div
                  key={order._id}
                  className='bg-white border border-gray-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4'
                >
                  <div>
                    <div className='flex items-center justify-between gap-2 mb-3'>
                      <span className='font-mono font-bold text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200'>
                        #{shortId}
                      </span>
                      <span className='text-[10px] text-gray-400 font-medium'>
                        {new Date(order.date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className='flex items-start gap-3 mb-4'>
                      <div className='w-10 h-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 font-bold text-xs text-gray-700'>
                        {order.address?.firstName?.[0] || 'O'}
                      </div>
                      <div>
                        <h4 className='font-bold text-gray-900 text-sm'>{order.address?.firstName} {order.address?.lastName}</h4>
                        <p className='text-xs text-gray-500 line-clamp-1'>📍 {order.address?.street}, {order.address?.city}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 mb-4 bg-gray-50 p-2.5 rounded-2xl border border-gray-100'>
                      {order.items?.slice(0, 3).map((it, idx) => (
                        <img
                          key={idx}
                          src={it.image?.[0]}
                          alt={it.name}
                          className="w-10 h-12 object-cover rounded-xl border border-gray-200 bg-white"
                        />
                      ))}
                      {order.items?.length > 3 && (
                        <span className='text-xs font-bold text-blue-600 pl-1'>+{order.items.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  <div className='pt-3 border-t border-gray-100 flex items-center justify-between gap-2'>
                    <div>
                      <p className='text-base font-black text-gray-900'>{currency}{order.amount?.toFixed(2)}</p>
                      <span className='text-[10px] text-gray-500 uppercase font-bold'>{order.paymentMethod}</span>
                    </div>

                    <div className='flex items-center gap-2'>
                      {order.cancelStatus === 'Requested' ? (
                        <div className="flex gap-1">
                          <button onClick={() => cancelActionHandler(order._id, 'approve')} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-xl text-[10px] font-bold transition-all shadow-xs cursor-pointer">Approve Cancel</button>
                          <button onClick={() => cancelActionHandler(order._id, 'reject')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-xl text-[10px] font-bold transition-all shadow-xs cursor-pointer">Reject</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className='bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer'
                        >
                          Details
                        </button>
                      )}
                      <button
                        onClick={() => setOrderToDelete(order)}
                        className='bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer'
                        title="Delete Order Permanently"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <AdminOrderModal
        isOpen={Boolean(selectedOrderDetails)}
        onClose={() => setSelectedOrderDetails(null)}
        order={selectedOrderDetails}
        currency={currency}
        onStatusUpdate={statusHandler}
        onDeleteOrder={deleteOrderHandler}
        wishmasters={wishmasters}
        onAssignWishmaster={assignWishmasterHandler}
      />

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-2xl mx-auto border border-rose-200">
              🗑️
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-gray-900">Delete Order Permanently?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to delete order <strong className="text-black font-mono">#{orderToDelete._id?.slice(-8)?.toUpperCase()}</strong> ({orderToDelete.address?.firstName} {orderToDelete.address?.lastName})? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteOrderHandler(orderToDelete._id)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;