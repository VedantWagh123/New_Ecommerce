import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import TrackOrderModal from '../components/TrackOrderModal';
import AddReviewModal from '../components/AddReviewModal';
import { getStatusBadgeStyle } from '../utils/orderStatus';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';

const Orders = () => {
  const { backendUrl, token, currency, navigate } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  
  // Review Modal State
  const [reviewModalState, setReviewModalState] = useState({
    isOpen: false,
    product: null,
    orderId: null,
    mode: 'add'
  });
  const [reviewedKeys, setReviewedKeys] = useState([]);

  const loadOrderData = async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        setOrders(response.data.orders.reverse());
      }

      // Fetch user's submitted reviews to mark items as reviewed
      const reviewRes = await axios.post(backendUrl + '/api/review/user-eligible', {}, { headers: { Authorization: `Bearer ${token}` } });
      if (reviewRes.data.success) {
        setReviewedKeys(reviewRes.data.reviewedKeys || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [token]);

  return (
    <div className='border-t pt-10 pb-20 min-h-[75vh]'>
      <div className='flex items-center justify-between mb-6'>
        <div className='text-2xl sm:text-3xl font-bold tracking-tight'>
          <Title text1={'MY'} text2={'ORDERS'} />
        </div>
        {orders.length > 0 && (
          <button 
            onClick={loadOrderData}
            className='text-xs font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg transition-colors'
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
            <div key={n} className='h-32 bg-gray-100 animate-pulse rounded-xl' />
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
            className='bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-all'
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className='flex flex-col gap-6'>
          {orders.map((order) => {
            const currentStatus = order.status || 'Packing';
            const isDelivered = currentStatus.toLowerCase() === 'delivered';
            const orderDateStr = new Date(order.date).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div 
                key={order._id} 
                className='p-5 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow'
              >
                {/* Order Top Bar */}
                <div className='flex items-center justify-between border-b pb-3 mb-4 flex-wrap gap-2'>
                  <div>
                    <span className='text-xs text-gray-400 uppercase tracking-wider font-semibold'>Order ID</span>
                    <p className='text-sm font-bold text-gray-900 font-mono'>#{order._id?.slice(-8)?.toUpperCase() || order._id}</p>
                  </div>

                  <div className='flex items-center gap-3'>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(currentStatus)}`}>
                      {currentStatus}
                    </span>
                    <span className='text-xs text-gray-500 font-medium hidden sm:inline'>
                      Date: {orderDateStr}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className='flex flex-col gap-3'>
                  {order.items.map((item, itemIdx) => {
                    const itemKey = `${order._id}_${item._id || item.id}`;
                    const isAlreadyReviewed = reviewedKeys.includes(itemKey);

                    return (
                      <div key={itemIdx} className='flex items-center justify-between gap-4 text-sm flex-wrap sm:flex-nowrap border-b border-gray-50 pb-3 last:border-0 last:pb-0'>
                        <div className='flex items-center gap-4'>
                          <img 
                            className='w-16 h-20 object-cover rounded-lg border border-gray-100 bg-gray-50 shrink-0 cursor-pointer' 
                            src={item.image?.[0]} 
                            alt={item.name}
                            onClick={() => navigate(`/product/${item._id || item.id}`)}
                          />
                          <div>
                            <p 
                              className='font-semibold text-gray-900 line-clamp-1 cursor-pointer hover:underline'
                              onClick={() => navigate(`/product/${item._id || item.id}`)}
                            >
                              {item.name}
                            </p>
                            <div className='flex items-center gap-2 mt-1 text-xs text-gray-600 font-medium'>
                              <span className='text-black font-bold'>{currency}{item.price}</span>
                              <span className='text-gray-300'>•</span>
                              <span>Qty: {item.quantity}</span>
                              <span className='text-gray-300'>•</span>
                              <span className='bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-gray-700 font-bold'>Size: {item.size}</span>
                            </div>
                            <div className='mt-1'>
                              <span className='text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 inline-flex items-center gap-1'>
                                <span>🏪</span> Sold by: {item.storeName || 'Veloura Official'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className='flex items-center gap-4 ml-auto sm:ml-0'>
                          {/* Write Review CTA for Delivered Order Items */}
                          {isDelivered && (
                            isAlreadyReviewed ? (
                              <button
                                onClick={() => setReviewModalState({ isOpen: true, product: item, orderId: order._id, mode: 'edit' })}
                                className='text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-95'
                              >
                                <span>⭐ Edit Review</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setReviewModalState({ isOpen: true, product: item, orderId: order._id, mode: 'add' })}
                                className='text-xs font-bold bg-amber-400 hover:bg-amber-500 text-gray-900 px-3.5 py-1.5 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 active:scale-95'
                              >
                                <span>⭐ Write Review</span>
                              </button>
                            )
                          )}

                          <div className='text-right shrink-0'>
                            <span className='text-xs text-gray-400 block'>Item Total</span>
                            <span className='font-bold text-gray-900 text-sm'>{currency}{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Footer & Tracking / Invoice CTA */}
                <div className='border-t mt-4 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                  <div className='text-xs text-gray-500'>
                    <span>Payment: <strong className='text-gray-800 uppercase'>{order.paymentMethod}</strong></span>
                    <span className='mx-2'>•</span>
                    <span>Total Amount: <strong className='text-black text-sm'>{currency}{order.amount?.toFixed(2)}</strong></span>
                    
                    {(order.tax > 0 || order.platformFee > 0) && (
                      <div className='mt-1 text-gray-400'>
                        <span className='mr-2'>(Includes</span>
                        {order.platformFee > 0 && <span>Platform Fee: {currency}{order.platformFee?.toFixed(2)}</span>}
                        {order.platformFee > 0 && order.tax > 0 && <span className='mx-1'>&</span>}
                        {order.tax > 0 && <span>GST: {currency}{order.tax?.toFixed(2)}</span>}
                        <span>)</span>
                      </div>
                    )}
                  </div>

                  <div className='flex items-center gap-2.5 self-end sm:self-auto flex-wrap'>
                    <button 
                      onClick={() => generateInvoicePDF(order)}
                      className='bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-4 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer'
                      title="Download Official GST Tax Invoice PDF"
                    >
                      <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download Tax Invoice</span>
                    </button>

                    <button 
                      onClick={() => setSelectedOrderForTracking(order)} 
                      className='bg-black hover:bg-gray-800 text-white px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer'
                    >
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Track Order</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Tracking Modal */}
      <TrackOrderModal
        isOpen={Boolean(selectedOrderForTracking)}
        onClose={() => setSelectedOrderForTracking(null)}
        order={selectedOrderForTracking}
        currency={currency}
      />

      {/* Add Review Modal */}
      <AddReviewModal
        isOpen={reviewModalState.isOpen}
        onClose={() => setReviewModalState({ isOpen: false, product: null, orderId: null, mode: 'add' })}
        product={reviewModalState.product}
        orderId={reviewModalState.orderId}
        mode={reviewModalState.mode}
        backendUrl={backendUrl}
        token={token}
        onReviewSubmitted={loadOrderData}
      />
    </div>
  );
};

export default Orders;
