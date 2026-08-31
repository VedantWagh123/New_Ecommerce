import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  ShoppingBag, 
  MapPin, 
  User, 
  Clock, 
  Eye, 
  X,
  CreditCard,
  Banknote,
  Truck,
  Package,
  CheckCircle2,
  Smartphone,
  PackageCheck,
  QrCode,
  ScanLine
} from 'lucide-react';
import { SocketContext } from '../context/SocketContext';

const currency = '$';

const Orders = ({ token, searchQuery }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [showOtpPrompt, setShowOtpPrompt] = useState({ orderId: null, action: null });
  const [showCodPrompt, setShowCodPrompt] = useState(null); 
  const [showScanner, setShowScanner] = useState(false);

  const handleUpiPayment = (orderId) => {
    setShowScanner(true);
    setTimeout(() => {
      setShowScanner(false);
      handleCodSubmit(orderId, 'UPI');
      toast.success('Payment Collected via UPI');
    }, 5000);
  };

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/delivery/my-deliveries`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrders(response.data.orders);
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
      socket.on('connect', handleUpdate);
      socket.on('new-notification', handleUpdate);
      socket.on('order-updated', handleUpdate);
      return () => {
        socket.off('connect', handleUpdate);
        socket.off('new-notification', handleUpdate);
        socket.off('order-updated', handleUpdate);
      };
    }
  }, [socket]);

  const handleOtpSubmit = async (orderId, action) => {
    if (!otpInput) {
      toast.error('Please enter the OTP');
      return;
    }
    
    try {
      setUpdatingId(orderId);
      const endpoint = action === 'pickup' ? '/api/delivery/pickup' : '/api/delivery/deliver';
      
      const response = await axios.post(`${backendUrl}${endpoint}`, {
        orderId,
        otp: otpInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowOtpPrompt({ orderId: null, action: null });
        setOtpInput('');
        fetchOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCodSubmit = async (orderId, method) => {
    try {
      setUpdatingId(orderId);
      const response = await axios.post(`${backendUrl}/api/delivery/collect-cod`, {
        orderId,
        method
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowCodPrompt(null);
        fetchOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const response = await axios.post(`${backendUrl}/api/delivery/status`, {
        orderId,
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReturnAction = async (orderId, action) => {
    try {
      setUpdatingId(orderId);
      const endpoint = action === 'pickup' ? '/api/delivery/return/pickup' : '/api/delivery/return/deliver';
      
      const response = await axios.post(`${backendUrl}${endpoint}`, {
        orderId
      }, {
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
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (order.status === 'Assigned') return false; 
    const matchesSearch = !searchQuery ||
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTimelineProgress = (status) => {
    const statuses = ['Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
    const idx = statuses.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const Timeline = ({ currentStatus }) => {
    const steps = [
      { key: 'Accepted (Delivery)', label: 'Pickup', icon: Package },
      { key: 'Picked Up', label: 'Picked Up', icon: PackageCheck },
      { key: 'In Transit', label: 'Transit', icon: Truck },
      { key: 'Out for Delivery', label: 'Out for Del', icon: MapPin },
      { key: 'Delivered', label: 'Delivered', icon: CheckCircle2 }
    ];
    
    const currentIndex = getTimelineProgress(currentStatus);

    return (
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100 relative">
        <div className="absolute top-[45px] left-8 right-8 h-1 bg-slate-100 rounded-full -z-10"></div>
        <div className="absolute top-[45px] left-8 h-1 bg-indigo-500 rounded-full -z-10 transition-all duration-500" style={{ width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 2rem)` }}></div>

        {steps.map((step, idx) => {
          const isActive = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;
          
          return (
            <div key={step.key} className="flex flex-col items-center gap-2 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'
              } ${isCurrent ? 'ring-4 ring-indigo-100 scale-110' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-indigo-900' : 'text-slate-400'}`}>{step.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const ReturnTimeline = ({ currentStatus }) => {
    const steps = [
      { key: 'Approved', label: 'Assigned', icon: Package },
      { key: 'In Transit', label: 'Transit', icon: Truck },
      { key: 'Received', label: 'Delivered', icon: CheckCircle2 }
    ];
    
    const statuses = ['Approved', 'In Transit', 'Received', 'QC Failed'];
    const currentIndex = Math.max(0, statuses.indexOf(currentStatus));

    return (
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100 relative max-w-sm mx-auto">
        <div className="absolute top-[45px] left-8 right-8 h-1 bg-slate-100 rounded-full -z-10"></div>
        <div className="absolute top-[45px] left-8 h-1 bg-rose-500 rounded-full -z-10 transition-all duration-500" style={{ width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 2rem)` }}></div>

        {steps.map((step, idx) => {
          const isActive = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;
          
          return (
            <div key={step.key} className="flex flex-col items-center gap-2 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                isActive ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'
              } ${isCurrent ? 'ring-4 ring-rose-100 scale-110' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-rose-900' : 'text-slate-400'}`}>{step.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Active & Past Deliveries</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Track and manage your delivery assignments here.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-white border border-slate-100 rounded-3xl animate-pulse"></div>)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
          <ShoppingBag className="w-16 h-16 text-indigo-100 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800">No deliveries found</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">You don't have any deliveries matching this filter. Accept new orders from the dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:gap-8">
          {filteredOrders.map(order => (
            <div key={order._id} className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-black text-slate-900">
                      ORD-{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {['Approved', 'In Transit', 'Received', 'QC Failed'].includes(order.returnStatus) ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                        Reverse Pickup
                      </span>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.payment ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.paymentMethod} • {order.payment ? 'Paid' : 'Unpaid COD'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  {order.cancelStatus === 'Requested' ? (
                     <span className="text-xs font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">
                        Cancel Requested
                     </span>
                  ) : ['Approved', 'In Transit', 'Received', 'QC Failed'].includes(order.returnStatus) ? (
                     <div className="flex w-full lg:w-auto items-center gap-3 bg-rose-50 p-2 rounded-2xl border border-rose-100">
                       <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider pl-2">Return Action:</span>
                       {order.returnStatus === 'Approved' && (
                          <button onClick={() => handleReturnAction(order._id, 'pickup')} disabled={updatingId === order._id} className="flex-1 lg:flex-none px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-2">
                            <Package className="w-4 h-4"/> Pick Up Return
                          </button>
                       )}
                       {order.returnStatus === 'In Transit' && (
                          <button onClick={() => handleReturnAction(order._id, 'deliver')} disabled={updatingId === order._id} className="flex-1 lg:flex-none px-5 py-2.5 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4"/> Deliver to Seller
                          </button>
                       )}
                       {['Received', 'QC Failed'].includes(order.returnStatus) && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4"/> Return Delivered
                          </span>
                       )}
                     </div>
                  ) : (() => {
                     const DELIVERY_STATUSES = ['Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
                     const currentIdx = DELIVERY_STATUSES.indexOf(order.status);
                     
                     if (currentIdx === -1) {
                         return <span className="text-xs font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl">{order.status}</span>;
                     } else if (order.status === 'Delivered') {
                         return <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Delivered</span>;
                     } else {
                         return (
                            <div className="flex w-full lg:w-auto items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Action:</span>
                               {order.status === 'Accepted (Delivery)' && (
                                  <button onClick={() => setShowOtpPrompt({ orderId: order._id, action: 'pickup' })} className="flex-1 lg:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                                    Verify Pickup
                                  </button>
                               )}
                               {order.status === 'Picked Up' && (
                                  <button onClick={() => handleStatusUpdate(order._id, 'In Transit')} disabled={updatingId === order._id} className="flex-1 lg:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50">
                                    Mark In Transit
                                  </button>
                               )}
                               {order.status === 'In Transit' && (
                                  <button onClick={() => handleStatusUpdate(order._id, 'Out for Delivery')} disabled={updatingId === order._id} className="flex-1 lg:flex-none px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50">
                                    Mark Out for Delivery
                                  </button>
                               )}
                               {order.status === 'Out for Delivery' && (
                                  order.paymentMethod === 'COD' && (!order.codReceipt || order.codReceipt.status !== 'Collected') ? (
                                     <button onClick={() => setShowCodPrompt(order)} className="flex-1 lg:flex-none px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                                       <Banknote className="w-4 h-4"/> Collect COD
                                     </button>
                                  ) : (
                                     <button onClick={() => setShowOtpPrompt({ orderId: order._id, action: 'deliver' })} className="flex-1 lg:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                                       {order.paymentMethod === 'COD' && <span>✓ COD Collected &bull;</span>} Verify Delivery
                                     </button>
                                  )
                               )}
                            </div>
                         );
                     }
                  })()}

                  <button onClick={() => setSelectedOrder(order)} className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition-all shadow-sm" title="View Order Details">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Items & Shipping Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Items */}
                <div className="lg:col-span-2 space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordered Products ({order.items?.length || 0})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <img src={item.image?.[0] || 'https://via.placeholder.com/60'} alt="" className="w-14 h-16 object-cover rounded-xl border border-slate-200 bg-white flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{item.name}</h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Size: <strong className="text-slate-800">{item.size || 'M'}</strong> &bull; Qty: <strong className="text-slate-800">{item.quantity}</strong>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping & COD Info */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Details</p>
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-4">
                    <div className="flex items-center gap-3 text-slate-900 font-bold">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-sm">{order.address?.firstName} {order.address?.lastName}</span>
                    </div>
                    <div className="flex items-start gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-xs font-medium leading-relaxed pt-1.5">
                        {order.address?.street}, {order.address?.city}, {order.address?.state} - {order.address?.zipcode}
                      </span>
                    </div>
                    
                    {order.paymentMethod === 'COD' && (
                      <div className={`mt-4 p-4 rounded-xl border flex items-center justify-between ${
                        (order.codReceipt && order.codReceipt.status === 'Collected') 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div>
                          <span className={`text-[10px] font-bold uppercase block mb-0.5 ${
                            (order.codReceipt && order.codReceipt.status === 'Collected') ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            {(order.codReceipt && order.codReceipt.status === 'Collected') ? 'COD Collected' : 'To Collect (COD)'}
                          </span>
                          <span className="text-lg font-black text-slate-900">{currency}{order.amount}</span>
                        </div>
                        {(order.codReceipt && order.codReceipt.status === 'Collected') ? (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <Banknote className="w-5 h-5 text-amber-600" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Timeline */}
              {['Approved', 'In Transit'].includes(order.returnStatus) ? (
                 <ReturnTimeline currentStatus={order.returnStatus} />
              ) : ['Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(order.status) && order.returnStatus === 'None' ? (
                <Timeline currentStatus={order.status} />
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* OTP Modal */}
      {showOtpPrompt.orderId && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-start justify-center pt-24 p-4 z-[60] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-2 text-center">
              Verify {showOtpPrompt.action === 'pickup' ? 'Pickup' : 'Delivery'}
            </h3>
            <p className="text-xs text-slate-500 mb-6 text-center font-medium">
              Ask the {showOtpPrompt.action === 'pickup' ? 'Seller' : 'Customer'} for the 6-digit OTP to confirm.
            </p>
            <input
              type="text"
              maxLength="6"
              placeholder="0 0 0 0 0 0"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none text-center text-3xl font-black tracking-[0.5em] mb-3 transition-all"
            />
            
            <div className="flex justify-end mb-6">
              <button
                onClick={() => toast.success('OTP sent successfully')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-transparent border-none cursor-pointer"
              >
                Resend OTP
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowOtpPrompt({ orderId: null, action: null }); setOtpInput(''); }}
                className="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOtpSubmit(showOtpPrompt.orderId, showOtpPrompt.action)}
                disabled={updatingId === showOtpPrompt.orderId || otpInput.length < 5}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all shadow-sm"
              >
                {updatingId === showOtpPrompt.orderId ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COD Modal */}
      {showCodPrompt && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-start justify-center pt-24 p-4 z-[60] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Banknote className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 text-center">
              Collect Cash on Delivery
            </h3>
            <p className="text-xs text-slate-500 mb-6 text-center font-medium">
              Collect this amount from the customer before completing delivery.
            </p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center mb-6 shadow-inner">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Amount to Collect</span>
              <span className="text-4xl font-black text-slate-900">{currency}{showCodPrompt.amount}</span>
            </div>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleCodSubmit(showCodPrompt._id, 'Cash')}
                disabled={updatingId === showCodPrompt._id}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <Banknote className="w-5 h-5"/> Collect Cash
              </button>
              
              <button
                onClick={() => handleUpiPayment(showCodPrompt._id)}
                disabled={updatingId === showCodPrompt._id}
                className="w-full py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-sm border border-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <QrCode className="w-5 h-5"/> Collect via UPI
              </button>
            </div>

            <button
              onClick={() => setShowCodPrompt(null)}
              disabled={updatingId === showCodPrompt._id}
              className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-all shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* QR Code UI */}
      {showScanner && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-start justify-center pt-24 p-4 z-[70] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl flex flex-col items-center">
            <h3 className="text-slate-900 text-xl font-black mb-2 text-center">Company UPI QR</h3>
            <p className="text-xs text-slate-500 mb-6 text-center font-medium">Ask customer to scan and pay the exact amount.</p>
            
            <div className="relative w-56 h-56 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex items-center justify-center mb-4 p-2">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=FOREVER_COMPANY_UPI" alt="Company QR Code" className="w-full h-full object-contain" />
            </div>
            
            <p className="text-indigo-600 text-xs mt-2 animate-pulse font-bold bg-indigo-50 px-4 py-2.5 rounded-xl w-full text-center border border-indigo-100">Waiting for payment... Please wait.</p>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-start justify-center pt-16 p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5 shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900">Order Tracking</h3>
                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">ORD-{selectedOrder._id.slice(-8).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Status History Timeline */}
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Detailed Status History</h4>
              <div className="space-y-4">
                {selectedOrder.statusHistory?.slice().reverse().map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4 text-sm relative pb-4 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 z-10 shadow-md">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="absolute top-8 left-4 bottom-0 w-px bg-slate-200 -ml-px last:hidden"></div>
                    <div className="flex-1 pt-1">
                      <p className="font-bold text-slate-900">{step.status}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{step.note}</p>
                      <span className="text-[10px] font-bold text-slate-400 mt-2 block uppercase tracking-wider">
                        {new Date(step.timestamp).toLocaleString()} &bull; {step.updatedBy}
                      </span>
                    </div>
                  </div>
                ))}
                {(!selectedOrder.statusHistory || selectedOrder.statusHistory.length === 0) && (
                  <p className="text-sm text-slate-500 font-medium py-4 text-center">No history available yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
