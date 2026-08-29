import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { getStatusBadgeStyle } from '../utils/orderStatus';
import { useLocation } from 'react-router-dom';

const Orders = () => {
  const { backendUrl, token, currency, navigate, socket } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const selectedOrderIdRef = useRef(null);
  const location = useLocation();

  const loadOrderData = useCallback(async (keepSelectedOrderId) => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        const freshOrders = response.data.orders.reverse();
        setOrders(freshOrders);
        // Use ref so we always have the latest selectedOrder ID
        const idToUpdate = keepSelectedOrderId ?? selectedOrderIdRef.current;
        if (idToUpdate) {
          const updated = freshOrders.find(o => o._id === idToUpdate);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  // Keep ref always in sync with selectedOrder
  useEffect(() => {
    selectedOrderIdRef.current = selectedOrder?._id ?? null;
  }, [selectedOrder]);

  useEffect(() => {
    loadOrderData();
  }, [token, loadOrderData]);

  useEffect(() => {
    if (socket) {
      const handleNotification = (notif) => {
        if (notif.orderId) {
          loadOrderData();
        }
      };
      socket.on('new-notification', handleNotification);
      socket.on('order-updated', loadOrderData);
      return () => {
        socket.off('new-notification', handleNotification);
        socket.off('order-updated', loadOrderData);
      };
    }
  }, [socket, loadOrderData]);

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

  // ── Auto-polling: refresh silently in background ──────────────────────────
  // • Every 8s when the order detail modal is open (user is watching status)
  // • Every 15s when just the list is showing
  // • Pauses automatically when the browser tab is hidden (Page Visibility API)
  useEffect(() => {
    if (!token) return;

    const MODAL_INTERVAL = 8000;   // 8 seconds
    const LIST_INTERVAL  = 15000;  // 15 seconds

    let intervalId = null;

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      const delay = selectedOrderIdRef.current ? MODAL_INTERVAL : LIST_INTERVAL;
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadOrderData(); // silently refreshes; ref drives selectedOrder update
        }
      }, delay);
    };

    startPolling();

    // When tab becomes visible again, restart immediately
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadOrderData();
        startPolling();
      } else {
        clearInterval(intervalId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, Boolean(selectedOrder)]);
  // ─────────────────────────────────────────────────────────────────────────


  return (
    <div className='border-t pt-10 pb-20 min-h-[75vh]'>
      <div className='flex items-center justify-between mb-6'>
        <div className='text-2xl sm:text-3xl font-bold tracking-tight'>
          <Title text1={'MY'} text2={'ORDERS'} />
        </div>
        {orders.length > 0 && (
          <button 
            onClick={loadOrderData}
            className='text-xs font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer'
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Status
          </button>
        )}
      </div>

      {loading ? (
        <div className='flex flex-col gap-4'>
          {[1, 2, 3].map((n) => (
            <div key={n} className='h-24 bg-gray-100 animate-pulse rounded-xl' />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16 text-center border border-gray-100 rounded-2xl bg-gray-50/50 p-6'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4'>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className='text-xl font-bold text-gray-900 mb-1'>No orders found</h3>
          <p className='text-sm text-gray-500 mb-6 max-w-sm'>You haven't placed any orders yet. Start exploring our latest products!</p>
          <button 
            onClick={() => navigate('/collection')}
            className='bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-all cursor-pointer'
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {orders.map((order) => {
            const currentStatus = order.status || 'Order Placed';
            const orderDateStr = new Date(order.date).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div 
                key={order._id} 
                className='p-5 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between'
              >
                <div>
                    <div className='flex items-center justify-between border-b pb-3 mb-3'>
                    <div>
                        <span className='text-xs text-gray-400 uppercase tracking-wider font-semibold'>Order ID</span>
                        <p className='text-sm font-bold text-gray-900 font-mono'>#{order._id?.slice(-8)?.toUpperCase() || order._id}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(currentStatus)}`}>
                        {currentStatus}
                    </span>
                    </div>

                    <div className='flex items-center gap-3 mb-4'>
                        <div className="flex -space-x-2">
                            {order.items.slice(0, 3).map((item, idx) => (
                                <img key={idx} src={item.image?.[0]} alt="" className="w-10 h-12 object-cover rounded border border-gray-200 bg-white" />
                            ))}
                            {order.items.length > 3 && (
                                <div className="w-10 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-500 z-10">
                                    +{order.items.length - 3}
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">
                            <p className="font-semibold text-gray-900">{order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}</p>
                            <p>{orderDateStr}</p>
                        </div>
                    </div>
                </div>

                <div className='flex items-center justify-between mt-auto pt-3 border-t border-gray-50'>
                  <div>
                    <p className='text-xs text-gray-500'>Total Amount</p>
                    <p className='text-sm font-bold text-gray-900'>{currency}{order.amount?.toFixed(2)}</p>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedOrder(order)} 
                    className='bg-black hover:bg-gray-800 text-white px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer'
                  >
                    View Order Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        currency={currency}
        onRefresh={loadOrderData}
      />
    </div>
  );
};

export default Orders;
