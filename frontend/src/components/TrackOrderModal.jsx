import React from 'react';
import { ORDER_STATUS, STATUS_STEPS, getStatusStepIndex, getStatusBadgeStyle } from '../utils/orderStatus';

const TrackOrderModal = ({ isOpen, onClose, order, currency = '$' }) => {
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
        estimatedDelivery
    } = order;

    const currentStepIndex = getStatusStepIndex(status);

    // Calculate delivery estimate if missing
    const estDeliveryText = estimatedDelivery || new Date(date + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const isCancelled = status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.DELIVERY_FAILED;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div 
                className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                Order #{_id?.slice(-8)?.toUpperCase() || _id}
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(status)}`}>
                                {status}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Placed on {new Date(date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                        title="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Delivery Estimate Box */}
                    {!isCancelled && (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-emerald-800 font-medium">Estimated Delivery</p>
                                    <p className="text-sm sm:text-base font-bold text-emerald-950">{estDeliveryText}</p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-md border border-emerald-200 shadow-xs hidden sm:inline-block">
                                On Schedule
                            </span>
                        </div>
                    )}

                    {/* Progress Timeline Stepper */}
                    {isCancelled ? (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
                            <p className="text-sm font-bold text-rose-800">This order has been {status.toLowerCase()}.</p>
                            <p className="text-xs text-rose-600 mt-1">If you have any questions, please contact customer support.</p>
                        </div>
                    ) : (
                        <div className="p-4 sm:p-6 bg-gray-50/60 border border-gray-100 rounded-xl">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Delivery Progress</h3>
                            
                            {/* Desktop Horizontal Stepper */}
                            <div className="hidden md:flex items-center justify-between relative">
                                {/* Background Line */}
                                <div className="absolute top-4 left-6 right-6 h-1 bg-gray-200 -z-0" />
                                {/* Progress Line */}
                                <div 
                                    className="absolute top-4 left-6 h-1 bg-emerald-500 transition-all duration-500 -z-0" 
                                    style={{ width: `${Math.max(0, Math.min(100, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100))}%` }}
                                />

                                {STATUS_STEPS.map((stepName, idx) => {
                                    const isPassed = currentStepIndex > idx;
                                    const isCurrent = currentStepIndex === idx;

                                    return (
                                        <div key={stepName} className="flex flex-col items-center relative z-10 w-24 text-center">
                                            <div 
                                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                                    isPassed 
                                                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-100' 
                                                        : isCurrent 
                                                            ? 'bg-black text-white ring-4 ring-gray-200 animate-pulse' 
                                                            : 'bg-white text-gray-400 border-2 border-gray-300'
                                                }`}
                                            >
                                                {isPassed ? '✓' : idx + 1}
                                            </div>
                                            <p className={`text-xs mt-2 font-semibold ${isCurrent ? 'text-black' : isPassed ? 'text-emerald-700' : 'text-gray-400'}`}>
                                                {stepName}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Mobile Vertical Stepper */}
                            <div className="md:hidden flex flex-col gap-4">
                                {STATUS_STEPS.map((stepName, idx) => {
                                    const isPassed = currentStepIndex > idx;
                                    const isCurrent = currentStepIndex === idx;

                                    return (
                                        <div key={stepName} className="flex items-start gap-3">
                                            <div className="flex flex-col items-center">
                                                <div 
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                                        isPassed 
                                                            ? 'bg-emerald-500 text-white' 
                                                            : isCurrent 
                                                                ? 'bg-black text-white ring-2 ring-gray-200 animate-pulse' 
                                                                : 'bg-gray-100 text-gray-400 border'
                                                    }`}
                                                >
                                                    {isPassed ? '✓' : idx + 1}
                                                </div>
                                                {idx < STATUS_STEPS.length - 1 && (
                                                    <div className={`w-0.5 h-6 my-1 ${isPassed ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                                )}
                                            </div>
                                            <div className="pt-0.5">
                                                <p className={`text-xs font-bold ${isCurrent ? 'text-black' : isPassed ? 'text-emerald-700' : 'text-gray-400'}`}>
                                                    {stepName}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Status History Timeline Log */}
                    {statusHistory && statusHistory.length > 0 && (
                        <div className="border border-gray-100 rounded-xl p-4 sm:p-5 bg-white">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Tracking History & Activity</h3>
                            <div className="space-y-4">
                                {statusHistory.map((historyItem, index) => (
                                    <div key={index} className="flex items-start gap-3 text-xs pb-3 border-b border-gray-50 last:border-b-0 last:pb-0">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between flex-wrap gap-1">
                                                <span className="font-bold text-gray-900">{historyItem.status}</span>
                                                <span className="text-gray-400 text-[11px]">
                                                    {new Date(historyItem.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                            </div>
                                            {historyItem.note && (
                                                <p className="text-gray-600 mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                                                    "{historyItem.note}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Two Column Layout: Delivery Address & Order Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Delivery Address Box */}
                        <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 text-xs text-gray-700 space-y-1">
                            <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-2 text-[11px]">Delivery Address</h4>
                            <p className="font-semibold text-sm text-gray-900">{address.firstName} {address.lastName}</p>
                            <p>{address.street}</p>
                            <p>{address.city}, {address.state} {address.zipcode}</p>
                            <p>{address.country}</p>
                            <p className="pt-1 text-gray-500">Phone: <span className="font-medium text-gray-800">{address.phone}</span></p>
                        </div>

                        {/* Payment & Price Summary Box */}
                        <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 text-xs text-gray-700 space-y-2">
                            <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-2 text-[11px]">Payment Details</h4>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Payment Method</span>
                                <span className="font-bold text-gray-900">{paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Payment Status</span>
                                <span className={`font-bold ${payment ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {payment ? 'Paid' : 'Pending (Pay on Delivery)'}
                                </span>
                            </div>
                            <div className="border-t pt-2 flex justify-between text-sm font-bold text-gray-900">
                                <span>Total Amount</span>
                                <span>{currency}{amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Items Breakdown */}
                    <div className="border border-gray-100 rounded-xl p-4 bg-white">
                        <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-3">Order Items ({items.length})</h4>
                        <div className="divide-y divide-gray-100">
                            {items.map((item, idx) => (
                                <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <img className="w-12 h-14 object-cover rounded bg-gray-50 border border-gray-100" src={item.image?.[0]} alt="" />
                                        <div>
                                            <p className="font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                                            <p className="text-gray-500 mt-0.5">Size: <span className="font-bold text-black">{item.size}</span> • Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="text-right font-bold text-gray-900">
                                        {currency}{(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-black hover:bg-gray-800 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-colors"
                    >
                        Close Tracking
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrackOrderModal;
