import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { ORDER_STATUS, STATUS_STEPS, getStatusStepIndex, getStatusBadgeStyle } from '../utils/orderStatus';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';
import axios from 'axios';
import { toast } from 'react-toastify';
import AddReviewModal from './AddReviewModal';

const OrderDetailsModal = ({ isOpen, onClose, order, currency = '$', onRefresh }) => {
    const { backendUrl, token, navigate } = useContext(ShopContext);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Review Modal State
    const [reviewModalState, setReviewModalState] = useState({
        isOpen: false,
        product: null,
        orderId: null,
        mode: 'add'
    });

    if (!isOpen || !order) return null;

    const {
        _id,
        items = [],
        amount = 0,
        address = {},
        status = ORDER_STATUS.PACKING,
        statusHistory = [],
        paymentMethod = 'COD',
        payment = false,
        date = Date.now(),
    } = order;

    // Use Order Placed as the first step instead of Packing for customer UI
    const customerSteps = [
        'Order Placed',
        ORDER_STATUS.ACCEPTED,
        ORDER_STATUS.PACKED,
        ORDER_STATUS.READY_TO_SHIP,
        ORDER_STATUS.SHIPPED,
        ORDER_STATUS.IN_TRANSIT,
        ORDER_STATUS.OUT_FOR_DELIVERY,
        ORDER_STATUS.DELIVERED
    ];

    // For visualization, map Packing to Order Placed
    const displayStatus = status === ORDER_STATUS.PACKING ? 'Order Placed' : status;
    const currentStepIndex = customerSteps.indexOf(displayStatus);
    const isCancelled = status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.DELIVERY_FAILED;

    const getHistoryTimestamp = (stepStatus) => {
        // Map 'Order Placed' to 'Packing' if looking in history, because history might store 'Packing' or just use order.date
        if (stepStatus === 'Order Placed') return order.date;
        const historyItem = statusHistory.find(h => h.status === stepStatus);
        return historyItem ? historyItem.timestamp : null;
    };

    const handleCancelRequest = async (isAutoCancel) => {
        try {
            const reason = window.prompt("Please enter a reason for cancellation (optional):");
            if (reason === null) return; // User cancelled the prompt

            const response = await axios.post(
                backendUrl + '/api/order/cancel/request',
                { orderId: _id, reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success(response.data.message);
                if (onRefresh) onRefresh();
                if (isAutoCancel) onClose();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Calculate elapsed time
    const orderAgeHours = (Date.now() - date) / (1000 * 60 * 60);
    const canCancelAuto = orderAgeHours <= 24;
    const canCancelRequest = orderAgeHours > 24 && orderAgeHours <= 48;
    const cancelExpired = orderAgeHours > 48;
    
    // Check if cancellation is completely blocked by status (backend does this too, but we hide button in UI)
    const beyondCancellation = ['Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];
    const isBeyondCancellation = beyondCancellation.includes(status);

    return (
        <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div 
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                Order #{_id?.slice(-8)?.toUpperCase() || _id}
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(displayStatus)}`}>
                                {displayStatus}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Placed on {new Date(date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={async () => {
                                if (isRefreshing) return;
                                setIsRefreshing(true);
                                if (onRefresh) await onRefresh();
                                setIsRefreshing(false);
                                toast.success("Order status updated!", { autoClose: 1500 });
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-colors shadow-xs hover:shadow"
                            title="Refresh Status"
                        >
                            <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                        <button 
                            onClick={() => generateInvoicePDF(order)}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-colors shadow-xs hover:shadow"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Invoice
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-9 h-9 ml-1 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                            title="Close modal"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white space-y-8">
                    
                    {/* Visual Timeline Stepper */}
                    <section>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Delivery Timeline</h3>
                        {isCancelled ? (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-rose-800">This order has been cancelled.</p>
                                    {order.cancelReason && <p className="text-xs text-rose-600 mt-1">Reason: {order.cancelReason}</p>}
                                    <p className="text-xs text-gray-500 mt-2">
                                        Cancelled at: {new Date(order.updatedAt || Date.now()).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="px-2">
                                {/* Desktop Horizontal Stepper */}
                                <div className="hidden md:flex items-start justify-between relative px-6">
                                    <div className="absolute top-4 left-10 right-10 h-1 bg-gray-100 -z-0" />
                                    <div 
                                        className="absolute top-4 left-10 h-1 bg-emerald-500 transition-all duration-500 -z-0" 
                                        style={{ width: `${Math.max(0, Math.min(100, (currentStepIndex / (customerSteps.length - 1)) * 100))}%` }}
                                    />
                                    {customerSteps.map((stepName, idx) => {
                                        // For Delivered, if it's the current step, we can treat it visually as 'passed' (fully green)
                                        const isPassed = currentStepIndex > idx || (stepName === ORDER_STATUS.DELIVERED && currentStepIndex === idx);
                                        const isCurrent = currentStepIndex === idx && stepName !== ORDER_STATUS.DELIVERED;
                                        const timestamp = getHistoryTimestamp(stepName);

                                        return (
                                            <div key={stepName} className="flex flex-col items-center relative z-10 w-20">
                                                <div 
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm ${
                                                        isPassed 
                                                            ? 'bg-emerald-500 text-white ring-4 ring-emerald-50' 
                                                            : isCurrent 
                                                                ? 'bg-white text-emerald-600 border-2 border-emerald-500 ring-4 ring-emerald-50 shadow-md animate-pulse' 
                                                                : 'bg-white text-gray-300 border-2 border-gray-200'
                                                    }`}
                                                >
                                                    {isPassed ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : idx + 1}
                                                </div>
                                                <p className={`text-[10px] mt-2 font-bold text-center leading-tight ${isCurrent ? 'text-emerald-700' : isPassed ? 'text-gray-800' : 'text-gray-400'}`}>
                                                    {stepName}
                                                </p>
                                                {timestamp && (
                                                    <p className="text-[9px] text-gray-500 mt-1 text-center font-medium">
                                                        {new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br/>
                                                        {new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Mobile Vertical Stepper */}
                                <div className="md:hidden flex flex-col gap-4">
                                    {customerSteps.map((stepName, idx) => {
                                        const isPassed = currentStepIndex > idx || (stepName === ORDER_STATUS.DELIVERED && currentStepIndex === idx);
                                        const isCurrent = currentStepIndex === idx && stepName !== ORDER_STATUS.DELIVERED;
                                        const timestamp = getHistoryTimestamp(stepName);

                                        return (
                                            <div key={stepName} className="flex items-start gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div 
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                                                            isPassed 
                                                                ? 'bg-emerald-500 text-white' 
                                                                : isCurrent 
                                                                    ? 'bg-white text-emerald-600 border-2 border-emerald-500 ring-2 ring-emerald-50 animate-pulse' 
                                                                    : 'bg-gray-50 text-gray-400 border border-gray-200'
                                                        }`}
                                                    >
                                                        {isPassed ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : idx + 1}
                                                    </div>
                                                    {idx < customerSteps.length - 1 && (
                                                        <div className={`w-0.5 h-8 my-1 ${isPassed ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                                    )}
                                                </div>
                                                <div className="pt-1 flex-1">
                                                    <p className={`text-sm font-bold ${isCurrent ? 'text-emerald-700' : isPassed ? 'text-gray-800' : 'text-gray-400'}`}>
                                                        {stepName}
                                                    </p>
                                                    {timestamp && (
                                                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                                            {new Date(timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Summary & Delivery */}
                        <section className="space-y-6">
                            <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-5">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Order Summary</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-semibold">{currency}{(amount - (order.tax || 0) - (order.platformFee || 0)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Shipping & Platform</span>
                                        <span className="font-semibold">{currency}{(order.platformFee || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Estimated Tax</span>
                                        <span className="font-semibold">{currency}{(order.tax || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-gray-900 text-base">
                                        <span>Total</span>
                                        <span>{currency}{amount.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-2 flex justify-between items-center">
                                        <span className="text-gray-500 text-xs">Payment Method: <span className="font-bold text-gray-900">{paymentMethod}</span></span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${payment ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {payment ? 'Paid' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-5">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Delivery Address</h3>
                                <div className="text-sm text-gray-800 space-y-1">
                                    <p className="font-bold text-gray-900 text-base mb-1">{address.firstName} {address.lastName}</p>
                                    <p>{address.street}</p>
                                    <p>{address.city}, {address.state} {address.zipcode}</p>
                                    <p>{address.country}</p>
                                    <p className="pt-2 text-gray-500">Phone: <span className="font-medium text-gray-800">{address.phone}</span></p>
                                </div>
                            </div>
                        </section>

                        {/* Items & Cancellation */}
                        <section className="space-y-6">
                            <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Items Ordered</h3>
                                <div className="divide-y divide-gray-50">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="py-3 first:pt-0 last:pb-0">
                                            <div className="flex gap-4">
                                                <img 
                                                    src={item.image?.[0]} 
                                                    alt={item.name}
                                                    className="w-16 h-20 object-cover rounded-lg border border-gray-100 bg-gray-50 cursor-pointer"
                                                    onClick={() => navigate(`/product/${item._id || item.id}`)}
                                                />
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900 text-sm line-clamp-2 cursor-pointer hover:underline" onClick={() => navigate(`/product/${item._id || item.id}`)}>
                                                        {item.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                        <span>Size: <strong className="text-gray-900">{item.size}</strong></span>
                                                        <span>•</span>
                                                        <span>Qty: <strong className="text-gray-900">{item.quantity}</strong></span>
                                                    </div>
                                                    <div className="mt-2 flex justify-between items-center">
                                                        <span className="font-bold text-gray-900">{currency}{item.price}</span>
                                                        {status === ORDER_STATUS.DELIVERED && (
                                                            <button 
                                                                onClick={() => setReviewModalState({ isOpen: true, product: item, orderId: order._id, mode: 'add' })}
                                                                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                                                            >
                                                                ⭐ Review
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cancellation Section */}
                            {!isBeyondCancellation && order.cancelStatus !== 'Approved' && (
                                <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Order Management</h3>
                                    
                                    {order.cancelStatus === 'Requested' ? (
                                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-3">
                                            <span className="text-amber-500 text-xl">⏳</span>
                                            <div>
                                                <p className="text-sm font-bold text-amber-900">Cancellation Requested</p>
                                                <p className="text-xs text-amber-700 mt-1">Your request is waiting for admin approval.</p>
                                            </div>
                                        </div>
                                    ) : order.cancelStatus === 'Rejected' ? (
                                        <div className="p-4 bg-rose-50 rounded-lg border border-rose-100 flex items-start gap-3">
                                            <span className="text-rose-500 text-xl">✕</span>
                                            <div>
                                                <p className="text-sm font-bold text-rose-900">Cancellation Rejected</p>
                                                <p className="text-xs text-rose-700 mt-1">Your request to cancel this order was declined by the administrator.</p>
                                            </div>
                                        </div>
                                    ) : canCancelAuto ? (
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <p className="text-sm font-bold text-gray-900 mb-1">Need to cancel?</p>
                                            <p className="text-xs text-gray-500 mb-4">You can automatically cancel this order within the first 24 hours.</p>
                                            <button 
                                                onClick={() => handleCancelRequest(true)}
                                                className="w-full py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-bold transition-colors"
                                            >
                                                Cancel Order
                                            </button>
                                        </div>
                                    ) : canCancelRequest ? (
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <p className="text-sm font-bold text-gray-900 mb-1">Need to cancel?</p>
                                            <p className="text-xs text-gray-500 mb-4">Since 24 hours have passed, your cancellation requires administrator approval.</p>
                                            <button 
                                                onClick={() => handleCancelRequest(false)}
                                                className="w-full py-2.5 bg-white border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-lg text-sm font-bold transition-colors"
                                            >
                                                Request Cancellation
                                            </button>
                                        </div>
                                    ) : cancelExpired ? (
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                            <p className="text-sm font-bold text-gray-500">Cancellation window has expired.</p>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>

        {/* Add Review Modal */}
        <AddReviewModal
            isOpen={reviewModalState.isOpen}
            onClose={() => setReviewModalState({ isOpen: false, product: null, orderId: null, mode: 'add' })}
            product={reviewModalState.product}
            orderId={reviewModalState.orderId}
            mode={reviewModalState.mode}
            backendUrl={backendUrl}
            token={token}
            onReviewSubmitted={onRefresh}
        />
        </>
    );
};

export default OrderDetailsModal;
