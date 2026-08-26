import React from 'react';
import { useNavigate } from 'react-router-dom';

const OrderSuccessModal = ({ isOpen, onClose, orderDetails }) => {
    const navigate = useNavigate();

    if (!isOpen || !orderDetails) return null;

    const {
        orderId = 'ORD-20260823-99X1A',
        itemCount = 1,
        totalAmount = 0,
        currency = '$',
        paymentMethod = 'Cash on Delivery',
        deliveryEstimate = '3–5 business days',
        address = {}
    } = orderDetails;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl transform transition-all animate-scale-up relative overflow-hidden border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative background subtle glow */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-100 rounded-full blur-2xl opacity-60 pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-blue-100 rounded-full blur-2xl opacity-60 pointer-events-none" />

                {/* Success Checkmark Circle & Micro Animation */}
                <div className="relative mb-6 text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 text-emerald-600 shadow-inner">
                        <svg className="w-10 h-10 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                d="M5 13l4 4L19 7" 
                                className="animate-draw-check" 
                            />
                        </svg>
                    </div>
                </div>

                {/* Title & Celebration Header */}
                <div className="text-center mb-6">
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                        Order Placed Successfully! 🎉
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Thank you! Your order has been placed and is being processed.
                    </p>
                </div>

                {/* Order Summary Box */}
                <div className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-100 mb-6 text-sm">
                    <div className="flex items-center justify-between border-b pb-3 mb-3">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Order ID</span>
                        <span className="font-mono font-bold text-gray-900 bg-white border border-gray-200 px-2.5 py-1 rounded text-xs">
                            #{orderId}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-gray-600">
                        <div>
                            <p className="text-xs text-gray-400">Total Items</p>
                            <p className="font-semibold text-gray-900">{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Amount Paid</p>
                            <p className="font-bold text-emerald-600">{currency}{totalAmount.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Payment Method</p>
                            <p className="font-medium text-gray-800">{paymentMethod}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Est. Delivery</p>
                            <p className="font-medium text-gray-800">{deliveryEstimate}</p>
                        </div>
                    </div>

                    {address && address.street && (
                        <div className="border-t pt-3 mt-3">
                            <p className="text-xs text-gray-400">Deliver To</p>
                            <p className="font-medium text-gray-800 line-clamp-1 mt-0.5">
                                {address.firstName} {address.lastName} • {address.street}, {address.city}
                            </p>
                        </div>
                    )}
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => {
                            onClose();
                            navigate('/orders');
                        }}
                        className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-200 shadow-md text-center active:scale-[0.98]"
                    >
                        View My Orders
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            navigate('/collection');
                        }}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-200 text-center active:scale-[0.98]"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessModal;
