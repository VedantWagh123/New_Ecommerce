import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { 
    Crown, Truck, Percent, Landmark, Sparkles, 
    Camera, Shirt, Flame, Bell, CheckCircle2, ArrowRight, RefreshCw, X, CreditCard, QrCode, ShieldCheck, Lock
} from 'lucide-react';
import { toast } from 'react-toastify';

const Membership = () => {
    const navigate = useNavigate();
    const { token, backendUrl, vipStatus, vipSubscription, fetchVipStatus } = useContext(ShopContext);
    const [submitting, setSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CARD' | 'NETBANKING'
    const [upiId, setUpiId] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    const handleOpenPayment = () => {
        if (!token) {
            toast.info("Please login to join VIP Membership");
            navigate('/login');
            return;
        }
        setShowPaymentModal(true);
    };

    const handleConfirmPayment = async () => {
        try {
            setSubmitting(true);
            const res = await axios.post(`${backendUrl}/api/subscription/request`, {
                plan: 'TRIAL_1RS',
                amount: 1,
                paymentMethod: paymentMethod
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success("✅ Payment of ₹1 Successful! Subscription request submitted for Admin approval.");
                setShowPaymentModal(false);
                await fetchVipStatus(token);
                // Redirect user to normal website Home page as requested
                navigate('/');
            } else {
                toast.error(res.data.message || "Failed to process payment");
            }
        } catch (error) {
            console.error("Subscription Request Error:", error);
            toast.error(error.response?.data?.message || "Payment process failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const comparisonFeatures = [
        {
            name: "Delivery Benefits",
            normalText: "Standard Shipping (₹50)",
            premiumText: "Unlimited Free Express Delivery"
        },
        {
            name: "Member Discounts",
            normalText: "0% Extra Discount",
            premiumText: "Flat Extra 10% OFF"
        },
        {
            name: "Bank Offers",
            normalText: "Standard Bank Offers",
            premiumText: "VIP Exclusive Extra Bank Offers"
        },
        {
            name: "AI Personal Stylist",
            normalText: "Basic Single Queries",
            premiumText: "4-Piece Outfit Builder"
        },
        {
            name: "Complete Outfit Cart Agent",
            normalText: "Manual 1-by-1 Add",
            premiumText: "1-Click Outfit Cart Agent"
        },
        {
            name: "AI Visual Search",
            normalText: "Standard Match",
            premiumText: "High-Accuracy Vision Search"
        },
        {
            name: "Virtual Try-On",
            normalText: "Limited Preview",
            premiumText: "Unlimited Virtual Fit Studio"
        },
        {
            name: "Price Drop Alerts",
            normalText: "No Price Alerts",
            premiumText: "Instant Price Drop Notifications"
        },
        {
            name: "Early Access to Trending Products",
            normalText: "Standard Launch",
            premiumText: "24-Hour VIP Early Access"
        },
        {
            name: "Personalized Recommendations",
            normalText: "Standard Algorithmic",
            premiumText: "Deep Preference AI Matching"
        },
        {
            name: "Priority Support",
            normalText: "Standard Email Support",
            premiumText: "24/7 Priority Support"
        },
        {
            name: "Exclusive Member Deals",
            normalText: "No Exclusive Deals",
            premiumText: "Secret Member-Only Sales"
        }
    ];

    const benefitCards = [
        {
            icon: Truck,
            title: "Free Delivery",
            desc: "Enjoy free delivery on eligible orders across all fashion collections."
        },
        {
            icon: Percent,
            title: "Member Discounts",
            desc: "Unlock exclusive member-only deals & stack extra discounts at checkout."
        },
        {
            icon: Landmark,
            title: "Extra Bank Offers",
            desc: "Get access to selected premium offers and instant bank cashbacks."
        },
        {
            icon: Sparkles,
            title: "AI Personal Stylist",
            desc: "Get personalized outfit recommendations for any occasion."
        },
        {
            icon: Camera,
            title: "AI Visual Search",
            desc: "Find similar products using images and uploaded outfit photos."
        },
        {
            icon: Shirt,
            title: "Virtual Try-On",
            desc: "Visualize outfits and fit before adding them to your cart."
        },
        {
            icon: Flame,
            title: "Early Access",
            desc: "Get early access to selected trending products before public drop."
        },
        {
            icon: Bell,
            title: "Price Drop Alerts",
            desc: "Know when your favorite wishlist products become cheaper."
        }
    ];

    return (
        <div className="py-8 space-y-16 max-w-6xl mx-auto text-gray-800 font-sans relative">
            
            {/* VIP MEMBER PORTAL (WHEN ACTIVE) */}
            {vipStatus === 'active' && (
                <section className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/10 p-6 sm:p-10 rounded-3xl border-2 border-amber-400 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-200 pb-6">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-black uppercase tracking-wider shadow-sm">
                                <Crown className="w-4 h-4 fill-black" />
                                <span>Forever VIP GOLD MEMBER</span>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-black text-gray-900">
                                Welcome to Your VIP Portal
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">
                                Your site-wide VIP privileges are active! Enjoy ₹0 Free Shipping & Extra 10% OFF at checkout.
                            </p>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-amber-300 shadow-sm text-right space-y-1 self-stretch sm:self-auto">
                            <span className="text-[11px] text-gray-500 font-bold uppercase block">Membership Status</span>
                            <span className="text-emerald-600 font-black text-sm flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-4 h-4" /> ACTIVE
                            </span>
                            {vipSubscription?.expiryDate && (
                                <span className="text-[11px] text-gray-500 font-medium block">
                                    Expires: {new Date(vipSubscription.expiryDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Active Perks Summary Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                            <div className="flex items-center justify-between text-amber-900 font-bold text-xs">
                                <span>🚚 Express Delivery</span>
                                <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">FREE (₹0)</span>
                            </div>
                            <p className="text-xs text-gray-500">Auto-applied to every cart order</p>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                            <div className="flex items-center justify-between text-amber-900 font-bold text-xs">
                                <span>💰 Member Discount</span>
                                <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">EXTRA 10% OFF</span>
                            </div>
                            <p className="text-xs text-gray-500">Auto-deducted at cart summary</p>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                            <div className="flex items-center justify-between text-amber-900 font-bold text-xs">
                                <span>🤖 AI Stylist Agent</span>
                                <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">UNLIMITED</span>
                            </div>
                            <p className="text-xs text-gray-500">4-piece outfit builder & 1-click cart</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button
                            onClick={() => navigate('/collection')}
                            className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>Shop Now with VIP Discounts</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </section>
            )}

            {/* PENDING APPROVAL CARD (WHEN STATUS IS PENDING) */}
            {vipStatus === 'pending' && (
                <section className="bg-amber-50/80 border-2 border-amber-300 p-6 sm:p-10 rounded-3xl shadow-lg space-y-5">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                            <Clock className="w-6 h-6 animate-spin" />
                        </div>

                        <div className="space-y-1.5 flex-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full">
                                <span>⏳ REQUEST UNDER REVIEW</span>
                            </div>
                            <h2 className="text-2xl font-black text-amber-950">
                                Subscription Request Pending Admin Approval
                            </h2>
                            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed font-medium">
                                Your <strong>₹1 Payment</strong> has been received and your VIP subscription request has been submitted successfully! 
                                An admin is reviewing your request. As soon as it is approved in the Admin Panel, your site-wide VIP perks (Free Delivery & 10% Extra Discount) will activate automatically!
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-amber-200 flex items-center justify-between gap-4 text-xs">
                        <span className="text-gray-600 font-medium">Status: <strong className="text-amber-700">Awaiting Admin Verification</strong></span>
                        <button
                            onClick={() => fetchVipStatus(token)}
                            className="text-amber-800 hover:text-amber-950 font-bold underline flex items-center gap-1 cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Check Approval Status
                        </button>
                    </div>
                </section>
            )}

            {/* HERO SECTION (WHEN NOT ACTIVE) */}
            {vipStatus !== 'active' && (
                <section className="text-center space-y-5 max-w-2xl mx-auto pt-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                        <Crown className="w-4 h-4 text-amber-600" />
                        <span>Forever PREMIUM</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
                        Unlock Premium Shopping
                    </h1>

                    <p className="text-gray-500 text-sm sm:text-base font-medium">
                        More savings. Smarter AI. Better shopping.
                    </p>

                    {/* Hero Pricing Card */}
                    <div className="pt-2 flex justify-center">
                        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xl max-w-md w-full text-center space-y-4">
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-gray-400 text-base line-through font-semibold">₹999</span>
                                <span className="text-4xl sm:text-5xl font-black text-gray-900">₹1</span>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">/ Starting membership</span>
                            </div>

                            {vipStatus === 'pending' ? (
                                <div className="w-full bg-amber-100 border border-amber-300 text-amber-900 font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4 animate-spin" />
                                    <span>Pending Admin Approval</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleOpenPayment}
                                    className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-xl text-sm uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 group"
                                >
                                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
                                    <span>JOIN PREMIUM — ₹1</span>
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ₹1 PAYMENT CHECKOUT MODAL */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                                <h3 className="font-bold text-sm tracking-wide">Forever VIP Membership Checkout</h3>
                            </div>
                            <button 
                                onClick={() => setShowPaymentModal(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="p-5 bg-amber-50/50 border-b border-amber-200/60 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-sm text-slate-900">VIP Gold Intro Trial Plan</h4>
                                <p className="text-xs text-slate-500">Includes Free Express Shipping & Extra 10% OFF</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 line-through block">₹999</span>
                                <span className="text-xl font-black text-slate-900">₹1.00</span>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="p-5 space-y-4">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Select Payment Method
                            </label>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setPaymentMethod('UPI')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                                        paymentMethod === 'UPI'
                                            ? 'bg-black text-white border-black shadow-sm'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <QrCode className="w-4 h-4" />
                                    <span>UPI / GPay</span>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('CARD')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                                        paymentMethod === 'CARD'
                                            ? 'bg-black text-white border-black shadow-sm'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    <span>Card</span>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('NETBANKING')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                                        paymentMethod === 'NETBANKING'
                                            ? 'bg-black text-white border-black shadow-sm'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <Landmark className="w-4 h-4" />
                                    <span>Net Banking</span>
                                </button>
                            </div>

                            {/* Method Content */}
                            {paymentMethod === 'UPI' && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span>UPI ID / VPA</span>
                                        <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">INSTANT DISPATCH</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. yourname@upi or 9876543210@paytm"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-slate-900"
                                    />
                                    <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-slate-500 font-medium">
                                        <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'CARD' && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Card Number</label>
                                        <input 
                                            type="text" 
                                            placeholder="4532 •••• •••• 8921"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-slate-900"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 block mb-1">Expiry (MM/YY)</label>
                                            <input 
                                                type="text" 
                                                placeholder="12/28"
                                                value={cardExpiry}
                                                onChange={(e) => setCardExpiry(e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 block mb-1">CVV</label>
                                            <input 
                                                type="password" 
                                                placeholder="•••"
                                                maxLength={3}
                                                value={cardCvv}
                                                onChange={(e) => setCardCvv(e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-slate-900"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'NETBANKING' && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                    <label className="text-xs font-bold text-slate-700 block">Popular Banks</label>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((bank, i) => (
                                            <div key={i} className="p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-center hover:border-slate-400 cursor-pointer">
                                                {bank}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer / CTA */}
                        <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-2">
                            <button
                                onClick={handleConfirmPayment}
                                disabled={submitting}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-6 rounded-xl text-sm uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Lock className="w-4 h-4" />
                                <span>{submitting ? 'Processing ₹1 Payment...' : 'Pay ₹1 & Submit Request'}</span>
                            </button>

                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>256-Bit SSL Encrypted Mock Payment Gateway</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FREE vs PREMIUM COMPARISON TABLE */}
            <section className="space-y-6">
                <div className="text-center space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                        Normal Shopping <span className="text-gray-400 font-normal">vs</span> Premium Membership
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                        Compare features side-by-side to see why Premium is worth it.
                    </p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[550px]">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200/80 text-xs text-gray-700 font-bold">
                                    <th className="p-4 sm:p-5 w-2/5">Feature</th>
                                    <th className="p-4 sm:p-5 text-center w-3/10 text-gray-500">Normal Shopping</th>
                                    <th className="p-4 sm:p-5 text-center w-3/10 text-amber-900 bg-amber-50/60 font-black">
                                        Premium Membership
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                                {comparisonFeatures.map((feat, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 sm:p-5 font-semibold text-gray-900">
                                            {feat.name}
                                        </td>
                                        <td className="p-4 sm:p-5 text-center text-gray-500">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">✕</span>
                                                <span>{feat.normalText}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 sm:p-5 text-center font-bold text-gray-900 bg-amber-50/30">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                                                <span>{feat.premiumText}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* PREMIUM BENEFITS CARDS GRID */}
            <section className="space-y-6">
                <div className="text-center space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                        Premium Benefits
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                        Everything included with your membership.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {benefitCards.map((b, i) => {
                        const IconComp = b.icon;
                        return (
                            <div
                                key={i}
                                className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow space-y-2.5"
                            >
                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                                    <IconComp className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-sm text-gray-900">
                                    {b.title}
                                </h3>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {b.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default Membership;
