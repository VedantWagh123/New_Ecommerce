import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ChevronRight, 
  Eye, 
  X,
  CreditCard,
  AlertTriangle,
  PackageX
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';

const currency = '₹';

const Orders = ({ token, searchQuery }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [inventoryMap, setInventoryMap] = useState({}); // productId -> { totalStock, stockMap }
  
  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [ordersRes, inventoryRes] = await Promise.all([
        axios.get(`${backendUrl}/api/seller/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${backendUrl}/api/seller/inventory`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.orders);
      } else {
        toast.error(ordersRes.data.message);
      }

      if (inventoryRes.data.success) {
        // Build a map: productId -> { totalStock, stockMap, name }
        const map = {};
        inventoryRes.data.inventory.forEach(item => {
          map[item._id] = {
            totalStock: item.totalStock,
            stockMap: item.stock || {},
            name: item.name
          };
        });
        setInventoryMap(map);
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
      socket.on('order-updated', handleUpdate);
      return () => {
        socket.off('connect', handleUpdate);
        socket.off('order-updated', handleUpdate);
      }
    }
  }, [socket]);

  // Open specific order from notification click
  useEffect(() => {
    if (orders.length > 0 && location.state?.openOrderId) {
      const targetOrder = orders.find(o => o._id === location.state.openOrderId);
      if (targetOrder) {
        setSelectedOrder(targetOrder);
        // Clear the state so it doesn't reopen on page refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [orders, location, navigate]);

  const handleStatusUpdate = async (orderId, newStatus, note = '') => {
    try {
      setUpdatingId(orderId);
      const response = await axios.post(`${backendUrl}/api/seller/orders/status`, {
        orderId,
        status: newStatus,
        note
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Check stock alerts for an order's items
  const getStockAlerts = (orderItems) => {
    const alerts = [];
    orderItems?.forEach(item => {
      const inv = inventoryMap[item._id] || inventoryMap[item.productId];
      if (!inv) return;
      const sizeStock = inv.stockMap?.[item.size] ?? inv.totalStock;
      if (sizeStock === 0) {
        alerts.push({ name: item.name, size: item.size, level: 'out', stock: sizeStock });
      } else if (sizeStock <= 5) {
        alerts.push({ name: item.name, size: item.size, level: 'low', stock: sizeStock });
      }
    });
    return alerts;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery ||
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Seller Order Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Fulfill customer orders, update shipping progress, and track real-time deliveries.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['all', 'Packing', 'Accepted', 'Packed', 'Ready for Pickup'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-medium">
          Loading seller orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No orders found</h3>
          <p className="text-xs text-slate-400 mt-1">Orders for your products will appear here automatically upon customer checkout.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-slate-900">
                      ORD-{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.payment ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {order.paymentMethod} ({order.payment ? 'Paid' : 'Unpaid COD'})
                    </span>
                  </div>
                </div>

                {/* Permitted Status Update Dropdown */}
                <div className="flex items-center gap-3 self-end lg:self-center">
                  {order.cancelStatus === 'Requested' ? (
                     <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                        Cancel Requested
                     </span>
                  ) : (() => {
                     const SELLER_STATUSES = ['Packing', 'Accepted', 'Packed', 'Ready for Pickup'];
                     const currentIdx = SELLER_STATUSES.indexOf(order.status);
                     
                     if (currentIdx === -1) {
                         // Beyond seller control
                         return (
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                               {order.status} (Admin Control)
                            </span>
                         );
                     } else if (currentIdx === SELLER_STATUSES.length - 1) {
                         return (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                               {order.status}
                            </span>
                         );
                     } else {
                         const nextStatus = SELLER_STATUSES[currentIdx + 1];
                         return (
                            <div className="flex gap-2">
                               <span className="text-xs font-bold text-slate-500 self-center hidden sm:inline">Action:</span>
                               <button
                                 onClick={() => handleStatusUpdate(order._id, nextStatus)}
                                 disabled={updatingId === order._id}
                                 className="px-4 py-1.5 bg-black hover:bg-slate-800 text-white border border-transparent rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                               >
                                 {updatingId === order._id ? '...' : `Mark ${nextStatus}`}
                               </button>
                               {order.status === 'Packing' && (
                                  <button
                                    onClick={() => { setOrderToReject(order._id); setRejectModalOpen(true); setRejectReason(''); }}
                                    disabled={updatingId === order._id}
                                    className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    Reject
                                  </button>
                               )}
                            </div>
                         );
                     }
                  })()}

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-all cursor-pointer"
                    title="View Order Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items & Shipping Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {/* Items */}
                <div className="md:col-span-2 space-y-3">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ordered Products</p>
                  <div className="space-y-2">
                    {order.items?.map((item, idx) => {
                      // Per-item stock check
                      const inv = inventoryMap[item._id] || inventoryMap[item.productId];
                      const sizeStock = inv ? (inv.stockMap?.[item.size] ?? inv.totalStock) : null;
                      const isOut = inv && sizeStock === 0;
                      const isLow = inv && sizeStock > 0 && sizeStock <= 5;
                      return (
                        <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                          isOut ? 'bg-rose-50 border-rose-200' :
                          isLow ? 'bg-amber-50 border-amber-200' :
                          'bg-slate-50 border-slate-100'
                        }`}>
                          <img
                            src={item.image?.[0] || item.image || 'https://via.placeholder.com/60'}
                            alt={item.name}
                            className={`w-12 h-14 object-cover rounded-lg border flex-shrink-0 ${
                              isOut ? 'border-rose-300' : isLow ? 'border-amber-300' : 'border-slate-200'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Size: <strong className="text-slate-800">{item.size || 'M'}</strong> &bull; Qty: <strong className="text-slate-800">{item.quantity}</strong>
                            </p>
                            {/* Inline stock badge per item */}
                            {isOut && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-300 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                <PackageX className="w-3 h-3" /> Out of Stock
                              </span>
                            )}
                            {isLow && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                <AlertTriangle className="w-3 h-3" /> Low Stock ({sizeStock} left)
                              </span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-slate-900">{currency}{item.price * item.quantity}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order-level stock alert banner */}
                  {(() => {
                    const alerts = getStockAlerts(order.items);
                    const hasOut = alerts.some(a => a.level === 'out');
                    const hasLow = alerts.some(a => a.level === 'low');
                    if (alerts.length === 0) return null;
                    return (
                      <div className={`flex items-start gap-3 p-3 rounded-xl border ${
                        hasOut
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          hasOut ? 'bg-rose-100' : 'bg-amber-100'
                        }`}>
                          {hasOut
                            ? <PackageX className="w-4 h-4 text-rose-600" />
                            : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${
                            hasOut ? 'text-rose-700' : 'text-amber-700'
                          }`}>
                            {hasOut ? '⚠️ Stock Alert: Item(s) Out of Stock' : '⚠️ Stock Alert: Low Stock Warning'}
                          </p>
                          <ul className={`mt-1 space-y-0.5 ${
                            hasOut ? 'text-rose-600' : 'text-amber-600'
                          }`}>
                            {alerts.map((a, i) => (
                              <li key={i} className="text-[11px] font-medium">
                                {a.level === 'out'
                                  ? `"${a.name}" (Size ${a.size}) — Stok khatam ho gaya. Restock karo ya order reject karo.`
                                  : `"${a.name}" (Size ${a.size}) — Sirf ${a.stock} unit bacha hai. Jaldi restock karo.`
                                }
                              </li>
                            ))}
                          </ul>
                          <a
                            href="/inventory"
                            className={`inline-block mt-2 text-[10px] font-bold underline underline-offset-2 ${
                              hasOut ? 'text-rose-600 hover:text-rose-800' : 'text-amber-600 hover:text-amber-800'
                            }`}
                          >
                            → Inventory Update Karo
                          </a>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Shipping Info */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-200/60 pb-2">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{order.address?.firstName} {order.address?.lastName}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>
                      {order.address?.street}, {order.address?.city}, {order.address?.state} - {order.address?.zipcode}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex justify-between font-bold text-slate-900">
                    <span>Seller Total:</span>
                    <span className="text-sm">{currency}{order.sellerAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Order Details</h3>
                <p className="text-xs text-slate-400 font-medium">ORD-{selectedOrder._id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status History Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Status Tracking Timeline</h4>
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {selectedOrder.statusHistory?.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{step.status}</p>
                      <p className="text-[11px] text-slate-500">{step.note}</p>
                      <span className="text-[10px] text-slate-400">Updated by {step.updatedBy} at {new Date(step.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrder(null)}
                className="py-2.5 px-6 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-extrabold text-rose-600">Reject Order</h3>
              <button onClick={() => setRejectModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Why are you rejecting this order?</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {['Stock not available', 'Product expired', 'Damaged inventory', 'Price incorrectly listed'].map(reason => (
                  <button
                    key={reason}
                    onClick={() => setRejectReason(reason)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      rejectReason === reason ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Or type a custom reason..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none h-24"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectReason) {
                    toast.error("Please provide a rejection reason.");
                    return;
                  }
                  handleStatusUpdate(orderToReject, 'Cancelled', `Rejected by Seller: ${rejectReason}`);
                  setRejectModalOpen(false);
                }}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
