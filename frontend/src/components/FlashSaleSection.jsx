import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Flame, Clock, Zap, ShoppingBag } from 'lucide-react';
import Title from './Title';
import axios from 'axios';

const FlashSaleSection = () => {
    const { backendUrl, products, currency, addToCart, navigate } = useContext(ShopContext);

    const [flashConfig, setFlashConfig] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchFlashSale = async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/flash-sale/active`);
            if (res.data.success && res.data.flashSale) {
                const fs = res.data.flashSale;
                setFlashConfig(fs);

                if (fs.endTime) {
                    const secondsRemaining = Math.max(0, Math.floor((new Date(fs.endTime).getTime() - Date.now()) / 1000));
                    setTimeLeft(secondsRemaining);
                }
            }
        } catch (err) {
            console.error("Fetch Active Flash Sale Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlashSale();
    }, []);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Format seconds into HH, MM, SS
    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return {
            hours: hours < 10 ? `0${hours}` : `${hours}`,
            minutes: minutes < 10 ? `0${minutes}` : `${minutes}`,
            seconds: seconds < 10 ? `0${seconds}` : `${seconds}`
        };
    };

    const { hours, minutes, seconds } = formatTime(timeLeft);

    // If disabled or loading or no products configured, don't render section
    if (loading || !flashConfig || !flashConfig.isActive || !flashConfig.selectedProducts || flashConfig.selectedProducts.length === 0) {
        return null;
    }

    const stockClaimedPercent = flashConfig.stockClaimedPercent || 85;

    // Filter valid products selected by Admin
    const flashProducts = flashConfig.selectedProducts
        .map(sp => {
            // Populate details if populated or from context catalog
            const prodObj = sp.productId && typeof sp.productId === 'object' 
                ? sp.productId 
                : products.find(p => p._id === sp.productId);

            if (!prodObj) return null;

            return {
                ...prodObj,
                discountPercent: sp.discountPercent || 35,
                allocatedStock: sp.allocatedStock || 50,
                claimedStock: sp.claimedStock || 42
            };
        })
        .filter(Boolean);

    if (flashProducts.length === 0) return null;

    return (
        <section className="my-14 bg-gradient-to-br from-amber-50/50 via-white to-rose-50/50 text-gray-900 rounded-3xl p-6 sm:p-10 border border-gray-200/90 shadow-xl overflow-hidden relative">
            {/* Background Decorative Glow */}
            <div className="absolute -top-10 -left-10 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-200/80 relative z-10">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider border border-rose-200 shadow-2xs">
                        <Flame className="w-4 h-4 text-rose-600 fill-rose-600 animate-bounce" />
                        <span>{flashConfig.title || 'MIDNIGHT FLASH SALE'}</span>
                    </div>

                    <div className="text-2xl sm:text-4xl font-bold tracking-tight">
                        <Title text1={'EXCLUSIVE'} text2={'FLASH DEALS'} />
                    </div>

                    <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-xl">
                        {flashConfig.subtitle || 'Handpicked luxury fashion items at unprecedented discounts. Limited stock available!'}
                    </p>
                </div>

                {/* Live Countdown Timer Boxes */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/90 p-4 rounded-2xl border border-gray-200/80 shadow-md backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold uppercase tracking-wider">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span>Ends In:</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center bg-gray-900 text-white px-3.5 py-2 rounded-xl border border-gray-800 shadow-sm min-w-[54px]">
                            <span className="text-xl sm:text-2xl font-black font-mono leading-none text-amber-300">{hours}</span>
                            <span className="text-[9px] text-gray-400 uppercase font-bold mt-1">HRS</span>
                        </div>

                        <span className="text-xl font-black text-gray-400 font-mono">:</span>

                        <div className="flex flex-col items-center bg-gray-900 text-white px-3.5 py-2 rounded-xl border border-gray-800 shadow-sm min-w-[54px]">
                            <span className="text-xl sm:text-2xl font-black font-mono leading-none text-amber-300">{minutes}</span>
                            <span className="text-[9px] text-gray-400 uppercase font-bold mt-1">MINS</span>
                        </div>

                        <span className="text-xl font-black text-gray-400 font-mono">:</span>

                        <div className="flex flex-col items-center bg-rose-600 text-white px-3.5 py-2 rounded-xl border border-rose-700 shadow-sm min-w-[54px]">
                            <span className="text-xl sm:text-2xl font-black font-mono leading-none animate-pulse">{seconds}</span>
                            <span className="text-[9px] text-rose-100 uppercase font-bold mt-1">SECS</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Stock Progress Bar */}
            <div className="my-6 space-y-2 relative z-10">
                <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-amber-800">
                        <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                        <span>{stockClaimedPercent}% Stock Claimed</span>
                    </span>
                    <span className="text-rose-600 font-extrabold animate-pulse">
                        Hurry, Only {100 - stockClaimedPercent}% Left in Stock!
                    </span>
                </div>

                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200 shadow-inner">
                    <div 
                        className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 rounded-full transition-all duration-1000 shadow-xs relative overflow-hidden"
                        style={{ width: `${stockClaimedPercent}%` }}
                    >
                        <div className="absolute inset-0 bg-white/30 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Admin Selected Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2 relative z-10">
                {flashProducts.map((item, idx) => {
                    const discount = item.discountPercent || 35;
                    const originalPrice = Math.round(item.price * (1 + discount / 100));
                    const claimedCount = item.claimedStock || 42;
                    const allocated = item.allocatedStock || 50;

                    return (
                        <div
                            key={item._id || idx}
                            className="bg-white border border-gray-200/90 hover:border-gray-400 rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md group cursor-pointer"
                        >
                            {/* Product Image Container with Smooth Zoom */}
                            <div 
                                className="w-full h-56 sm:h-64 bg-gray-50 rounded-xl overflow-hidden relative group"
                                onClick={() => navigate(`/product/${item._id}`)}
                            >
                                <img
                                    src={Array.isArray(item.image) ? item.image[0] : item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                />

                                {/* Admin Configured Flash Deal Badge */}
                                <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                                    <Zap className="w-3 h-3 fill-white" />
                                    <span>{discount}% OFF FLASH</span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="pt-3 space-y-2.5">
                                <h3 
                                    onClick={() => navigate(`/product/${item._id}`)}
                                    className="font-bold text-xs sm:text-sm text-gray-900 truncate hover:text-amber-700 transition-colors"
                                >
                                    {item.name}
                                </h3>

                                <div className="flex items-baseline gap-2">
                                    <span className="text-base sm:text-lg font-black text-gray-900">
                                        {currency}{item.price}
                                    </span>
                                    <span className="text-xs text-gray-400 line-through font-semibold">
                                        {currency}{originalPrice}
                                    </span>
                                </div>

                                {/* Stock Claimed Pill */}
                                <div className="flex items-center justify-between text-[11px] text-gray-600 font-medium bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <span>Claimed: <strong className="text-gray-900 font-bold">{claimedCount}/{allocated}</strong></span>
                                    <span className="text-rose-600 font-bold text-[10px]">Almost Sold Out</span>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const defaultSize = item.sizes?.[0] || 'M';
                                        addToCart(item._id, defaultSize);
                                    }}
                                    className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>Quick Claim Deal</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default FlashSaleSection;
