import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { 
    Crown, Truck, Percent, Landmark, Sparkles, 
    Camera, Shirt, Flame, Bell, CheckCircle2, ArrowRight, RefreshCw, X, CreditCard, QrCode, ShieldCheck, Lock, Clock
} from 'lucide-react';
import { toast } from 'react-toastify';

const Membership = () => {
    const navigate = useNavigate();
    const { token, backendUrl, vipStatus, vipSubscription, fetchVipStatus } = useContext(ShopContext);
    const [submitting, setSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('UPI');
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
        { name: "Delivery Benefits", normalText: "Standard Shipping (₹50)", premiumText: "Unlimited Free Express Delivery" },
        { name: "Member Discounts", normalText: "0% Extra Discount", premiumText: "Flat Extra 10% OFF" },
        { name: "Bank Offers", normalText: "Standard Bank Offers", premiumText: "VIP Exclusive Extra Bank Offers" },
        { name: "AI Personal Stylist", normalText: "Basic Single Queries", premiumText: "4-Piece Outfit Builder" },
        { name: "Complete Outfit Cart Agent", normalText: "Manual 1-by-1 Add", premiumText: "1-Click Outfit Cart Agent" },
        { name: "AI Visual Search", normalText: "Standard Match", premiumText: "High-Accuracy Vision Search" },
        { name: "Virtual Try-On", normalText: "Limited Preview", premiumText: "Unlimited Virtual Fit Studio" },
        { name: "Price Drop Alerts", normalText: "No Price Alerts", premiumText: "Instant Price Drop Notifications" },
        { name: "Early Access to Trending Products", normalText: "Standard Launch", premiumText: "24-Hour VIP Early Access" },
        { name: "Personalized Recommendations", normalText: "Standard Algorithmic", premiumText: "Deep Preference AI Matching" },
        { name: "Priority Support", normalText: "Standard Email Support", premiumText: "24/7 Priority Support" },
        { name: "Exclusive Member Deals", normalText: "No Exclusive Deals", premiumText: "Secret Member-Only Sales" }
    ];

    const benefitCards = [
        { icon: Truck, title: "Free Delivery", desc: "Enjoy free delivery on eligible orders across all fashion collections." },
        { icon: Percent, title: "Member Discounts", desc: "Unlock exclusive member-only deals & stack extra discounts at checkout." },
        { icon: Landmark, title: "Extra Bank Offers", desc: "Get access to selected premium offers and instant bank cashbacks." },
        { icon: Sparkles, title: "AI Personal Stylist", desc: "Get personalized outfit recommendations for any occasion." },
        { icon: Camera, title: "AI Visual Search", desc: "Find similar products using images and uploaded outfit photos." },
        { icon: Shirt, title: "Virtual Try-On", desc: "Visualize outfits and fit before adding them to your cart." },
        { icon: Flame, title: "Early Access", desc: "Get early access to selected trending products before public drop." },
        { icon: Bell, title: "Price Drop Alerts", desc: "Know when your favorite wishlist products become cheaper." }
    ];

    return (
        <div className="py-8 space-y-16 max-w-6xl mx-auto text-zinc-300 font-sans relative animate-fade-in">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none -z-10" />
            
            {/* VIP MEMBER PORTAL (WHEN ACTIVE) */}
            {vipStatus === 'active' && (
                <section className="bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-10 rounded-3xl border border-yellow-500/30 shadow-[0_0_40px_rgba(234,179,8,0.05)] space-y-6 relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6 relative z-10">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-600 to-amber-500 text-black text-xs font-black uppercase tracking-wider shadow-md shadow-yellow-500/20">
                                <Crown className="w-4 h-4 fill-black" />
                                <span>Forever VIP GOLD MEMBER</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent">
                                Welcome to Your VIP Portal
                            </h1>
                            <p className="text-sm text-zinc-400 font-medium">
                                Your site-wide VIP privileges are active! Enjoy ₹0 Free Shipping & Extra 10% OFF at checkout.
                            </p>
                        </div>

                        <div className="p-4 bg-zinc-950/50 rounded-2xl border border-yellow-500/20 shadow-inner text-right space-y-1 self-stretch sm:self-auto backdrop-blur-md">
                            <span className="text-[11px] text-zinc-500 font-bold uppercase block tracking-widest">Membership Status</span>
                            <span className="text-yellow-400 font-black text-sm flex items-center justify-end gap-1.5 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
                                <CheckCircle2 className="w-4 h-4" /> ACTIVE
                            </span>
                            {vipSubscription?.expiryDate && (
                                <span className="text-[11px] text-zinc-500 font-medium block">
                                    Expires: {new Date(vipSubscription.expiryDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Active Perks Summary Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 relative z-10">
                        <div className="p-5 bg-zinc-950/40 rounded-2xl border border-zinc-800 hover:border-yellow-500/30 transition-colors shadow-lg space-y-2 group">
                            <div className="flex items-center justify-between text-zinc-200 font-bold text-sm">
                                <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-yellow-500" /> Express Delivery</span>
                                <span className="text-[10px] font-black bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30 group-hover:bg-yellow-500 group-hover:text-black transition-colors">FREE (₹0)</span>
                            </div>
                            <p className="text-xs text-zinc-500">Auto-applied to every cart order</p>
                        </div>

                        <div className="p-5 bg-zinc-950/40 rounded-2xl border border-zinc-800 hover:border-yellow-500/30 transition-colors shadow-lg space-y-2 group">
                            <div className="flex items-center justify-between text-zinc-200 font-bold text-sm">
                                <span className="flex items-center gap-2"><Percent className="w-4 h-4 text-yellow-500" /> Member Discount</span>
                                <span className="text-[10px] font-black bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30 group-hover:bg-yellow-500 group-hover:text-black transition-colors">EXTRA 10% OFF</span>
                            </div>
                            <p className="text-xs text-zinc-500">Auto-deducted at cart summary</p>
                        </div>

                        <div className="p-5 bg-zinc-950/40 rounded-2xl border border-zinc-800 hover:border-yellow-500/30 transition-colors shadow-lg space-y-2 group">
                            <div className="flex items-center justify-between text-zinc-200 font-bold text-sm">
                                <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500" /> AI Stylist Agent</span>
                                <span className="text-[10px] font-black bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30 group-hover:bg-yellow-500 group-hover:text-black transition-colors">UNLIMITED</span>
                            </div>
                            <p className="text-xs text-zinc-500">4-piece outfit builder & 1-click cart</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 relative z-10">
                        <button
                            onClick={() => navigate('/collection')}
                            className="w-full sm:w-auto bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-black font-black px-8 py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all duration-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>Shop Now with VIP Discounts</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </section>
            )}

            {/* PENDING APPROVAL CARD (WHEN STATUS IS PENDING) */}
            {vipStatus === 'pending' && (
                <section className="bg-zinc-900/60 backdrop-blur-xl border border-yellow-500/30 p-6 sm:p-10 rounded-3xl shadow-[0_0_40px_rgba(234,179,8,0.05)] space-y-6">
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-yellow-500/30 text-yellow-500 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                            <Clock className="w-6 h-6 animate-spin" />
                        </div>

                        <div className="space-y-2 flex-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full tracking-wider">
                                <span>⏳ REQUEST UNDER REVIEW</span>
                            </div>
                            <h2 className="text-2xl font-black text-white">
                                Subscription Request Pending
                            </h2>
                            <p className="text-sm text-zinc-400 leading-relaxed font-medium max-w-2xl">
                                Your <strong className="text-yellow-400">₹1 Payment</strong> has been received! 
                                An admin is reviewing your request. As soon as it is approved, your site-wide VIP perks will activate automatically.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 flex items-center justify-between gap-4 text-xs">
                        <span className="text-zinc-500 font-medium">Status: <strong className="text-yellow-500">Awaiting Admin Verification</strong></span>
                        <button
                            onClick={() => fetchVipStatus(token)}
                            className="text-yellow-500 hover:text-yellow-400 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Check Approval Status
                        </button>
                    </div>
                </section>
            )}

            {/* HERO SECTION (WHEN NOT ACTIVE) */}
            {vipStatus !== 'active' && (
                <section className="text-center space-y-6 max-w-2xl mx-auto pt-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-black uppercase tracking-widest border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                        <Crown className="w-4 h-4 fill-yellow-500" />
                        <span>Forever PREMIUM</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent pb-2">
                        Unlock Premium Shopping
                    </h1>

                    <p className="text-zinc-400 text-sm sm:text-lg font-medium max-w-lg mx-auto leading-relaxed">
                        Elevate your style with exclusive savings, AI-powered styling, and zero delivery fees.
                    </p>

                    {/* Hero Pricing Card */}
                    <div className="pt-6 flex justify-center">
                        <div className="p-8 sm:p-10 rounded-[2rem] bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 shadow-2xl shadow-black max-w-md w-full text-center space-y-6 relative overflow-hidden group hover:border-yellow-500/30 transition-all duration-700">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
                            
                            <div className="flex items-baseline justify-center gap-3">
                                <span className="text-zinc-500 text-lg line-through font-semibold decoration-zinc-700">₹999</span>
                                <span className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent">₹1</span>
                                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">/ Intro Offer</span>
                            </div>

                            {vipStatus === 'pending' ? (
                                <div className="w-full bg-zinc-950 border border-yellow-500/20 text-yellow-500 font-bold py-4 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-inner">
                                    <Clock className="w-4 h-4 animate-spin" />
                                    <span>Pending Admin Approval</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleOpenPayment}
                                    className="w-full bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-black font-black py-4 px-6 rounded-xl text-sm uppercase tracking-widest transition-all duration-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <Crown className="w-5 h-5 fill-black" />
                                    <span>JOIN PREMIUM — ₹1</span>
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ₹1 PAYMENT CHECKOUT MODAL */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-zinc-950 rounded-3xl max-w-lg w-full border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transform transition-all animate-scale-up">
                        {/* Modal Header */}
                        <div className="bg-zinc-900 border-b border-zinc-800 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                                <h3 className="font-bold text-sm tracking-widest text-zinc-100 uppercase">Premium Checkout</h3>
                            </div>
                            <button 
                                onClick={() => setShowPaymentModal(false)}
                                className="text-zinc-500 hover:text-zinc-100 p-1.5 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="p-6 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
                            <div>
                                <h4 className="font-black text-sm text-yellow-500 tracking-wide">VIP Gold Intro Plan</h4>
                                <p className="text-[11px] text-zinc-400 mt-1 uppercase tracking-wider font-semibold">Free Shipping & 10% OFF</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-zinc-600 line-through block font-bold tracking-widest">₹999</span>
                                <span className="text-2xl font-black text-white">₹1.00</span>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="p-6 space-y-5">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">
                                Select Payment Method
                            </label>

                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setPaymentMethod('UPI')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-[11px] uppercase tracking-wide font-bold transition-all cursor-pointer ${
                                        paymentMethod === 'UPI'
                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
                                    }`}
                                >
                                    <QrCode className="w-5 h-5" />
                                    <span>UPI / GPay</span>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('CARD')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-[11px] uppercase tracking-wide font-bold transition-all cursor-pointer ${
                                        paymentMethod === 'CARD'
                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
                                    }`}
                                >
                                    <CreditCard className="w-5 h-5" />
                                    <span>Card</span>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('NETBANKING')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-[11px] uppercase tracking-wide font-bold transition-all cursor-pointer ${
                                        paymentMethod === 'NETBANKING'
                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
                                    }`}
                                >
                                    <Landmark className="w-5 h-5" />
                                    <span>Net Banking</span>
                                </button>
                            </div>

                            {/* Method Content */}
                            {paymentMethod === 'UPI' && (
                                <div className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-4">
                                    <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                                        <span className="uppercase tracking-widest text-[10px]">UPI ID / VPA</span>
                                        <span className="text-[9px] text-yellow-500 font-black bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 tracking-wider">INSTANT</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. yourname@upi"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-yellow-500/50 transition-colors placeholder:text-zinc-600"
                                    />
                                    <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                                        <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'CARD' && (
                                <div className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-2">Card Number</label>
                                        <input 
                                            type="text" 
                                            placeholder="4532 •••• •••• 8921"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-yellow-500/50 transition-colors placeholder:text-zinc-600 tracking-widest"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-2">Expiry</label>
                                            <input 
                                                type="text" 
                                                placeholder="MM/YY"
                                                value={cardExpiry}
                                                onChange={(e) => setCardExpiry(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-yellow-500/50 transition-colors placeholder:text-zinc-600 tracking-widest"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-2">CVV</label>
                                            <input 
                                                type="password" 
                                                placeholder="•••"
                                                maxLength={3}
                                                value={cardCvv}
                                                onChange={(e) => setCardCvv(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-yellow-500/50 transition-colors placeholder:text-zinc-600 tracking-widest"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'NETBANKING' && (
                                <div className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-3">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block">Popular Banks</label>
                                    <div className="grid grid-cols-2 gap-3 text-[11px] font-bold">
                                        {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((bank, i) => (
                                            <div key={i} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 text-center hover:border-yellow-500/50 hover:text-yellow-500 cursor-pointer transition-colors">
                                                {bank}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer / CTA */}
                        <div className="p-6 bg-zinc-900/50 border-t border-zinc-800 space-y-3">
                            <button
                                onClick={handleConfirmPayment}
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 text-black font-black py-4 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_25px_rgba(234,179,8,0.4)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Lock className="w-4 h-4" />
                                <span>{submitting ? 'Processing...' : 'Pay ₹1 & Activate'}</span>
                            </button>

                            <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-widest text-zinc-600 font-bold">
                                <ShieldCheck className="w-3.5 h-3.5 text-yellow-600" />
                                <span>256-Bit SSL Encrypted Mock Gateway</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FREE vs PREMIUM COMPARISON TABLE */}
            <section className="space-y-8 pt-6">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl sm:text-4xl font-black text-white">
                        Free <span className="text-zinc-600 font-light italic px-2">vs</span> Premium
                    </h2>
                    <p className="text-sm text-zinc-500 font-medium">
                        See why the elite upgrade their shopping experience.
                    </p>
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-md rounded-[2rem] border border-zinc-800 shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 font-black">
                                    <th className="p-6 w-2/5">Feature</th>
                                    <th className="p-6 text-center w-3/10">Standard Account</th>
                                    <th className="p-6 text-center w-3/10 text-yellow-500 bg-yellow-500/5">
                                        Premium Member
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50 text-sm">
                                {comparisonFeatures.map((feat, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                                        <td className="p-5 font-semibold text-zinc-300">
                                            {feat.name}
                                        </td>
                                        <td className="p-5 text-center text-zinc-500 text-xs font-medium">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center font-bold text-[10px] shrink-0">✕</span>
                                                <span>{feat.normalText}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center font-bold text-yellow-400 bg-yellow-500/5 text-xs">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold text-[10px] shrink-0">✓</span>
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
            <section className="space-y-8 pt-4 pb-12">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl sm:text-4xl font-black text-white">
                        Exclusive Privileges
                    </h2>
                    <p className="text-sm text-zinc-500 font-medium">
                        Everything you unlock immediately upon joining.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {benefitCards.map((b, i) => {
                        const IconComp = b.icon;
                        return (
                            <div
                                key={i}
                                className="p-6 rounded-3xl bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 hover:border-yellow-500/30 shadow-lg hover:shadow-[0_0_30px_rgba(234,179,8,0.05)] transition-all duration-300 space-y-4 group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 group-hover:border-yellow-500/30 flex items-center justify-center text-zinc-500 group-hover:text-yellow-500 transition-colors shadow-inner">
                                    <IconComp className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-zinc-200 mb-1.5 group-hover:text-white transition-colors">
                                        {b.title}
                                    </h3>
                                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                                        {b.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default Membership;
