import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  MapPin, 
  ShoppingBag, 
  Clock, 
  ArrowRight, 
  Banknote,
  PackageCheck,
  Package,
  TrendingUp,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';

const currency = '$';

const Dashboard = ({ token, searchQuery }) => {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/delivery/my-deliveries`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAllOrders(response.data.orders || []);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const { socket } = useContext(SocketContext);

  useEffect(() => {
    if (socket) {
      const handleUpdate = () => fetchOrders();
      socket.on('new-notification', handleUpdate);
      socket.on('order-updated', handleUpdate);
      return () => {
        socket.off('new-notification', handleUpdate);
        socket.off('order-updated', handleUpdate);
      };
    }
  }, [socket]);

  const handleAcceptDelivery = async (orderId) => {
    try {
      setAcceptingId(orderId);
      const response = await axios.post(`${backendUrl}/api/delivery/accept`, { orderId }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setAcceptingId(null);
    }
  };

  // Metrics Calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingAssignments = allOrders.filter(o => o.status === 'Assigned');
  const activeDeliveries = allOrders.filter(o => ['Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(o.status));
  const completedDeliveries = allOrders.filter(o => o.status === 'Delivered');
  const todaysDeliveries = completedDeliveries.filter(o => {
    // Check statusHistory for Delivered timestamp
    const deliveredStep = o.statusHistory?.find(s => s.status === 'Delivered');
    if (deliveredStep) {
      return new Date(deliveredStep.timestamp) >= today;
    }
    return false;
  });

  const codCollected = allOrders.reduce((sum, order) => {
    if (order.codReceipt?.status === 'Collected') {
      return sum + Number(order.codReceipt.amount || 0);
    }
    return sum;
  }, 0);

  const earnings = completedDeliveries.reduce((sum, order) => {
    return sum + Number(order.deliveryFee > 0 ? order.deliveryFee : 40);
  }, 0);

  const filteredAssignments = pendingAssignments.filter(order => {
    const matchesSearch = !searchQuery ||
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Wishmaster Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Welcome back! Here is your delivery performance and active assignments.
          </p>
        </div>
        <button onClick={fetchOrders} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" /> REFRESH
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl animate-pulse"></div>)}
          </div>
          <div className="h-64 bg-white border border-slate-100 rounded-3xl animate-pulse"></div>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Package className="w-16 h-16 text-indigo-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Today's Deliveries</p>
              <h3 className="text-3xl font-black text-slate-900">{todaysDeliveries.length}</h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <PackageCheck className="w-16 h-16 text-emerald-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Completed (All Time)</p>
              <h3 className="text-3xl font-black text-slate-900">{completedDeliveries.length}</h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Banknote className="w-16 h-16 text-amber-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">COD Collected</p>
              <h3 className="text-3xl font-black text-slate-900">{currency}{codCollected}</h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-16 h-16 text-blue-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Earnings</p>
              <h3 className="text-3xl font-black text-slate-900">{currency}{earnings}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column: Active & Assignments */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Active Delivery Highlight */}
              {activeDeliveries.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500" /> Active Deliveries
                    </h2>
                    <Link to="/orders" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                      View Details &rarr;
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDeliveries.slice(0, 2).map(order => (
                      <div key={order._id} className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-black text-indigo-900">ORD-{order._id.slice(-6).toUpperCase()}</span>
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 mb-4 text-slate-700">
                          <MapPin className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                          <p className="text-xs font-medium leading-relaxed">
                            {order.address?.street}, {order.address?.city}
                          </p>
                        </div>
                        <Link to="/orders" className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold block text-center shadow-sm hover:bg-indigo-700 transition-all">
                          Manage Delivery
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Assignments */}
              <div className="space-y-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" /> New Assignments ({filteredAssignments.length})
                </h2>
                
                {filteredAssignments.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
                    <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">You're all caught up!</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">No new assignments right now. We will notify you when a new order is assigned to you.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {filteredAssignments.map(order => (
                      <div key={order._id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block mb-0.5">
                              ORD-{order._id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3 h-3" /> 
                              {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <div className="text-right bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <span className="text-[9px] text-slate-500 block font-bold uppercase">Earn</span>
                            <span className="text-sm font-black text-emerald-600">{currency}{order.deliveryFee > 0 ? order.deliveryFee : 40}</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex-1 mb-4">
                          <div className="flex items-start gap-2 mb-2">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[11px] font-bold text-slate-800">{order.address?.firstName} {order.address?.lastName}</p>
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                                {order.address?.street}, {order.address?.city} - {order.address?.zipcode}
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-[10px] font-bold">
                            <span className="text-slate-500">{order.items?.length || 0} items</span>
                            <span className={`px-2 py-0.5 rounded-full ${order.payment ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {order.paymentMethod}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAcceptDelivery(order._id)}
                          disabled={acceptingId === order._id}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 text-xs tracking-wide"
                        >
                          {acceptingId === order._id ? 'ACCEPTING...' : (
                            <>ACCEPT <ArrowRight className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recent Activity */}
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" /> Recent Activity
              </h2>
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                {completedDeliveries.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No recent deliveries completed.</p>
                ) : (
                  <div className="space-y-4">
                    {completedDeliveries.slice(0, 5).map(order => (
                      <div key={order._id} className="flex items-start gap-3 relative pb-4 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 z-10">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="absolute top-8 left-4 bottom-0 w-px bg-slate-100 -ml-px last:hidden"></div>
                        <div className="flex-1 pt-1.5">
                          <p className="text-xs font-bold text-slate-800">Delivered ORD-{order._id.slice(-6).toUpperCase()}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {order.address?.city} &bull; Earned {currency}{order.deliveryFee > 0 ? order.deliveryFee : 40}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 pt-1.5">
                          {new Date(order.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
