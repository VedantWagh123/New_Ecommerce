import React, { useContext, useState, useEffect } from 'react';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import OrderSuccessModal from '../components/OrderSuccessModal';

const PlaceOrder = () => {
    const [method, setMethod] = useState('cod');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [completedOrderDetails, setCompletedOrderDetails] = useState(null);

    const { 
        navigate, 
        backendUrl, 
        token, 
        cartItems, 
        setCartItems, 
        products, 
        currency,
        getCartCount,
        karmaScore,
        getCartTotals,
        setCouponData
    } = useContext(ShopContext);

    const { subtotal, finalTotal, deliveryFee, couponCode, couponDiscountAmount, tax, platformFee } = getCartTotals();

    useEffect(() => {
        if (karmaScore < 40 && method === 'cod') {
            setMethod('stripe');
        }
    }, [karmaScore, method]);

    // Initial Address State (Loads from localStorage if saved previously)
    const [formData, setFormData] = useState(() => {
        try {
            const savedAddr = localStorage.getItem('user_shipping_address');
            return savedAddr ? JSON.parse(savedAddr) : {
                firstName: '',
                lastName: '',
                email: '',
                street: '',
                city: '',
                state: '',
                zipcode: '',
                country: '',
                phone: ''
            };
        } catch (e) {
            return {
                firstName: '', lastName: '', email: '', street: '', city: '', state: '', zipcode: '', country: '', phone: ''
            };
        }
    });

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setFormData(data => {
            const updated = { ...data, [name]: value };
            try {
                localStorage.setItem('user_shipping_address', JSON.stringify(updated));
            } catch (e) {}
            return updated;
        });
    };

    // Calculate cart items list for checkout review
    const orderItems = [];
    let totalItemsCount = 0;

    for (const itemId in cartItems) {
        for (const size in cartItems[itemId]) {
            const quantity = cartItems[itemId][size];
            if (quantity > 0) {
                const itemInfo = products.find(p => p._id === itemId);
                if (itemInfo) {
                    const clonedItem = structuredClone(itemInfo);
                    clonedItem.size = size;
                    clonedItem.quantity = quantity;
                    orderItems.push(clonedItem);
                    totalItemsCount += quantity;
                }
            }
        }
    }

    const isCartEmpty = totalItemsCount === 0;

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Order Payment',
            description: 'Order Payment',
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {
                try {
                    const { data } = await axios.post(backendUrl + '/api/order/verifyRazorpay', response, { headers: { Authorization: `Bearer ${token}` } });
                    if (data.success) {
                        handleOrderSuccess(order.receipt || `ORD-${Date.now()}`);
                    }
                } catch (error) {
                    console.log(error);
                    toast.error(error.message || 'Razorpay payment verification failed');
                } finally {
                    setIsSubmitting(false);
                }
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    const handleOrderSuccess = (generatedOrderId) => {
        const orderSummary = {
            orderId: generatedOrderId,
            itemCount: totalItemsCount,
            totalAmount: finalTotal,
            currency: currency,
            paymentMethod: method === 'cod' ? 'Cash on Delivery' : (method === 'stripe' ? 'Stripe Online' : 'Razorpay Online'),
            deliveryEstimate: '3–5 business days',
            address: formData
        };

        if (couponCode === 'BUNDLE20') {
            localStorage.setItem('bundleUsed', 'true');
        }
        setCompletedOrderDetails(orderSummary);
        setCartItems({});
        setCouponData({ code: '', discount: 0 }); // Clear the coupon data so it doesn't persist to the next order
        setShowSuccessModal(true);
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        if (isCartEmpty) {
            toast.error('Your cart is empty. Add products before placing an order.');
            return;
        }

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'street', 'city', 'zipcode', 'country', 'phone'];
        for (const field of requiredFields) {
            if (!formData[field] || formData[field].trim() === '') {
                toast.error(`Please complete all required fields (${field})`);
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const formattedOrderId = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
            const orderData = {
                address: formData,
                items: orderItems,
                amount: finalTotal,
                tax: tax,
                platformFee: platformFee,
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                couponCode: couponCode || '',
                couponDiscount: couponDiscountAmount || 0
            };

            switch (method) {
                case 'cod': {
                    if (token) {
                        const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { Authorization: `Bearer ${token}` } });
                        if (response.data.success) {
                            handleOrderSuccess(formattedOrderId);
                        } else {
                            toast.error(response.data.message || 'Failed to place order');
                        }
                    } else {
                        // Fallback for guest mode / local state
                        handleOrderSuccess(formattedOrderId);
                    }
                    break;
                }

                case 'stripe': {
                    if (!token) {
                        toast.error('Please login to process Stripe payment');
                        setIsSubmitting(false);
                        return;
                    }
                    const responseStripe = await axios.post(backendUrl + '/api/order/stripe', orderData, { headers: { Authorization: `Bearer ${token}` } });
                    if (responseStripe.data.success) {
                        const { session_url } = responseStripe.data;
                        window.location.replace(session_url);
                    } else {
                        toast.error(responseStripe.data.message);
                    }
                    break;
                }

                case 'razorpay': {
                    if (!token) {
                        toast.error('Please login to process Razorpay payment');
                        setIsSubmitting(false);
                        return;
                    }
                    const responseRazorpay = await axios.post(backendUrl + '/api/order/razorpay', orderData, { headers: { Authorization: `Bearer ${token}` } });
                    if (responseRazorpay.data.success) {
                        initPay(responseRazorpay.data.order);
                    } else {
                        toast.error(responseRazorpay.data.message);
                    }
                    break;
                }

                default:
                    break;
            }
        } catch (error) {
            console.error('Order submission error:', error);
            toast.error(error.message || 'Something went wrong while placing your order');
        } finally {
            if (method === 'cod') {
                setIsSubmitting(false);
            }
        }
    };

    if (isCartEmpty && !showSuccessModal) {
        return (
            <div className="border-t pt-14 pb-20 min-h-[65vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
                <p className="text-gray-500 max-w-sm mb-6 text-sm">
                    You cannot access checkout without items in your cart. Add products to continue shopping!
                </p>
                <button
                    onClick={() => navigate('/collection')}
                    className="bg-black hover:bg-gray-800 text-white font-medium px-8 py-3 rounded-xl text-sm transition-all"
                >
                    BROWSE PRODUCTS
                </button>
            </div>
        );
    }

    return (
        <div className="border-t pt-8 pb-20 min-h-[85vh]">
            {/* Step Progress Header */}
            <div className="max-w-4xl mx-auto mb-10 px-4">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-500 border-b pb-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold">✓</span>
                        <span>1. Cart Review</span>
                    </div>
                    <div className="h-0.5 w-8 sm:w-16 bg-gray-200" />
                    <div className="flex items-center gap-2 text-black font-bold">
                        <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">2</span>
                        <span>Delivery Address</span>
                    </div>
                    <div className="h-0.5 w-8 sm:w-16 bg-gray-200" />
                    <div className="flex items-center gap-2 text-gray-400">
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">3</span>
                        <span>Payment & Order</span>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmitHandler} className="flex flex-col lg:flex-row justify-between gap-10">
                {/* Left Side: Delivery Form & Order Items Review */}
                <div className="flex flex-col gap-6 w-full lg:max-w-[540px]">
                    <div>
                        <Title text1={'DELIVERY'} text2={'INFORMATION'} />
                        <p className="text-xs text-gray-500 mt-1">Please enter your shipping destination details</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <input
                            required
                            onChange={onChangeHandler}
                            name="firstName"
                            value={formData.firstName}
                            className="border border-gray-300 rounded-lg py-2.5 px-4 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            type="text"
                            placeholder="First name *"
                        />
                        <input
                            required
                            onChange={onChangeHandler}
                            name="lastName"
                            value={formData.lastName}
                            className="border border-gray-300 rounded-lg py-2.5 px-4 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            type="text"
                            placeholder="Last name *"
                        />
                    </div>

                    <input
                        required
                        onChange={onChangeHandler}
                        name="email"
                        value={formData.email}
                        className="border border-gray-300 rounded-lg py-2.5 px-4 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                        type="email"
                        placeholder="Email address *"
                    />

                    <input
                        required
                        onChange={onChangeHandler}
                        name="street"
                        value={formData.street}
                        className="border border-gray-300 rounded-lg py-2.5 px-4 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                        type="text"
                        placeholder="Street / Flat / Landmark *"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <input
                            required
                            onChange={onChangeHandler}
                            name="city"
                            value={formData.city}
                            className="border border-gray-300 rounded-lg py-2.5 px-4 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            type="text"
                            placeholder="City *"
                        />
                        <input
                            onChange={onChangeHandler}
                            name="state"
                            value={formData.state}
                            className="border border-gray-300 rounded-lg py-2.5 px-4 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            type="text"
                            placeholder="State"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <input
                            required
                            onChange={onChangeHandler}
                            name="zipcode"
                            value={formData.zipcode}
                            className="border border-gray-300 rounded-lg py-2.5 px-4 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            type="number"
                            placeholder="Zipcode / Pincode *"
                        />
                        <input
                            required
                            onChange={onChangeHandler}
                            name="country"
                            value={formData.country}
                            className="border border-gray-300 rounded-lg py-2.5 px-4 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                            type="text"
                            placeholder="Country *"
                        />
                    </div>

                    <input
                        required
                        onChange={onChangeHandler}
                        name="phone"
                        value={formData.phone}
                        className="border border-gray-300 rounded-lg py-2.5 px-4 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                        type="tel"
                        placeholder="Phone number *"
                    />

                    {/* Order Item Quick Summary Preview */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between border-b pb-2 mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Order Items ({totalItemsCount})</span>
                            <button type="button" onClick={() => navigate('/cart')} className="text-xs text-blue-600 font-semibold hover:underline">Edit Cart</button>
                        </div>
                        <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                            {orderItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <img className="w-8 h-10 object-cover rounded" src={item.image[0]} alt="" />
                                        <div>
                                            <p className="font-semibold line-clamp-1">{item.name}</p>
                                            <p className="text-gray-400">Size: {item.size} • Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Price Details & Payment Selection */}
                <div className="flex-1 lg:max-w-[480px]">
                    <CartTotal />

                    <div className="mt-10">
                        <Title text1={'PAYMENT'} text2={'METHOD'} />
                        <p className="text-xs text-gray-500 mt-1 mb-4">Select your preferred payment method</p>

                        {/* Payment Options Grid */}
                        <div className="flex flex-col gap-3">
                            {/* COD Option */}
                            <div
                                onClick={() => {
                                    if (karmaScore >= 40) setMethod('cod');
                                }}
                                className={`flex flex-col gap-2 border rounded-xl p-4 transition-all duration-200 ${
                                    karmaScore < 40 
                                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                        : method === 'cod' 
                                            ? 'border-black bg-gray-50 shadow-sm ring-1 ring-black cursor-pointer' 
                                            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${method === 'cod' ? 'border-black bg-black' : 'border-gray-400'}`}>
                                            {method === 'cod' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </span>
                                        <span className={`text-sm font-bold ${karmaScore < 40 ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                            CASH ON DELIVERY (COD)
                                        </span>
                                    </div>
                                    {karmaScore >= 40 && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Popular</span>}
                                </div>
                                
                                {karmaScore < 40 ? (
                                    <div className="mt-2 pl-7 flex items-start gap-2 text-rose-600 bg-rose-50 p-2 rounded-lg text-xs">
                                        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                        <p className="font-medium">
                                            Blocked due to low Karma Score (High return rate). Please use prepaid methods.
                                        </p>
                                    </div>
                                ) : method === 'cod' && (
                                    <p className="text-xs text-gray-500 pl-7">
                                        Pay securely in cash when your order is delivered to your doorstep.
                                    </p>
                                )}
                            </div>

                            {/* Stripe Option */}
                            <div
                                onClick={() => setMethod('stripe')}
                                className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                                    method === 'stripe' ? 'border-black bg-gray-50 shadow-sm ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${method === 'stripe' ? 'border-black bg-black' : 'border-gray-400'}`}>
                                        {method === 'stripe' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </span>
                                    <img className="h-5" src={assets.stripe_logo} alt="Stripe" />
                                </div>
                                <span className="text-xs text-gray-400">Cards / Apple Pay</span>
                            </div>

                            {/* Razorpay Option */}
                            <div
                                onClick={() => setMethod('razorpay')}
                                className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                                    method === 'razorpay' ? 'border-black bg-gray-50 shadow-sm ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${method === 'razorpay' ? 'border-black bg-black' : 'border-gray-400'}`}>
                                        {method === 'razorpay' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </span>
                                    <img className="h-5" src={assets.razorpay_logo} alt="Razorpay" />
                                </div>
                                <span className="text-xs text-gray-400">UPI / Netbanking</span>
                            </div>
                        </div>

                        {/* Submission CTA */}
                        <div className="mt-8">
                            <button
                                type="submit"
                                disabled={isSubmitting || isCartEmpty}
                                className={`w-full py-4 rounded-xl text-sm font-bold tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                                    isSubmitting || isCartEmpty
                                        ? 'bg-gray-400 text-white cursor-not-allowed opacity-70'
                                        : 'bg-black text-white hover:bg-gray-800 active:scale-[0.99]'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>PROCESSING ORDER...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>PLACE ORDER</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Order Success Modal */}
            <OrderSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                orderDetails={completedOrderDetails}
            />
        </div>
    );
};

export default PlaceOrder;
