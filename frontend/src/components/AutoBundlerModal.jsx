import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { X, Clock, ShoppingBag, Plus, Sparkles, CheckCircle2 } from 'lucide-react';

const AutoBundlerModal = ({ isOpen, onClose, primaryProduct, primarySize }) => {
    const { products, currency, addToCart, setCouponData } = useContext(ShopContext);
    const navigate = useNavigate();
    
    const [bundledProducts, setBundledProducts] = useState([]);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

    // Logic to find complementary products
    useEffect(() => {
        if (isOpen && primaryProduct) {
            let suggestions = [];
            const category = primaryProduct.category;

            const isTop = primaryProduct.subCategory === 'Topwear';
            const isBottom = primaryProduct.subCategory === 'Bottomwear';

            let neededSubCategories = [];
            if (isTop) neededSubCategories = ['Bottomwear', 'Footwear', 'Accessories'];
            else if (isBottom) neededSubCategories = ['Topwear', 'Footwear', 'Accessories'];
            else neededSubCategories = ['Topwear', 'Bottomwear', 'Accessories'];

            let matches = products.filter(p => p.category === category && p._id !== primaryProduct._id);
            
            for (let sub of neededSubCategories) {
                let match = matches.find(p => p.subCategory === sub);
                if (match && suggestions.length < 2) {
                    suggestions.push(match);
                    matches = matches.filter(p => p._id !== match._id);
                }
            }

            while (suggestions.length < 2 && matches.length > 0) {
                suggestions.push(matches.pop());
            }

            setBundledProducts(suggestions);
            setTimeLeft(600); 
        }
    }, [isOpen, primaryProduct, products]);

    useEffect(() => {
        let timer;
        if (isOpen && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft <= 0) {
            onClose(); 
        }
        return () => clearInterval(timer);
    }, [isOpen, timeLeft, onClose]);

    if (!isOpen || !primaryProduct || bundledProducts.length === 0) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const originalTotal = primaryProduct.price + bundledProducts.reduce((acc, curr) => acc + curr.price, 0);
    const bundlePrice = Math.round(originalTotal * 0.8); 
    const savings = originalTotal - bundlePrice;

    const handleAddBundle = () => {
        addToCart(primaryProduct._id, primarySize || primaryProduct.sizes[0]);
        bundledProducts.forEach(p => {
            addToCart(p._id, p.sizes[0]);
        });
        
        setCouponData({ code: 'BUNDLE20', discount: savings, isBundle: true });
        
        toast.success("🎉 Bundle Added! 20% Discount Applied.");
        onClose();
        navigate('/cart');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[2rem] overflow-hidden w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row border border-gray-100">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center bg-gray-100/80 hover:bg-gray-200 backdrop-blur-sm rounded-full transition-all hover:scale-110"
                >
                    <X className="w-5 h-5 text-gray-700" />
                </button>

                {/* Left Side: Visuals */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
                    </div>

                    <div className="absolute top-6 left-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1.5 z-20 animate-bounce-subtle">
                        <Sparkles className="w-3 h-3" /> Limited Time Offer
                    </div>
                    
                    <div className="relative w-full flex flex-col items-center gap-4 mt-10 z-10">
                        {/* Primary Item */}
                        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border-4 border-white group">
                            <img src={primaryProduct.image[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" alt={primaryProduct.name} />
                            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>
                        </div>
                        
                        {/* Plus Icon */}
                        <div className="flex items-center justify-center -mt-8 z-30">
                           <div className="bg-white rounded-full p-2 shadow-xl border border-gray-50 text-indigo-500">
                               <Plus className="w-6 h-6" />
                           </div>
                        </div>

                        {/* Bundled Items */}
                        <div className="flex gap-4 sm:gap-6 z-10 -mt-2">
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-xl border-4 border-white group">
                                <img src={bundledProducts[0].image[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" alt={bundledProducts[0].name} />
                            </div>
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-xl border-4 border-white group">
                                <img src={bundledProducts[1].image[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" alt={bundledProducts[1].name} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Details & CTA */}
                <div className="w-full md:w-7/12 p-8 sm:p-10 flex flex-col justify-center bg-white relative">
                    <h2 className="text-2xl sm:text-4xl font-black text-gray-900 leading-tight tracking-tight">
                        Complete The Look!
                    </h2>
                    <p className="text-sm sm:text-base text-gray-500 mt-3 leading-relaxed">
                        Our AI stylist suggests adding these perfectly matching items to your cart. Buy the entire bundle right now and get <span className="font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">20% OFF</span> everything.
                    </p>

                    {/* Timer */}
                    <div className="flex items-center gap-2.5 mt-6 bg-rose-50/80 text-rose-700 px-5 py-3 rounded-2xl font-bold border border-rose-100/50 w-fit shadow-sm">
                        <Clock className="w-5 h-5 animate-pulse" />
                        <span className="text-sm sm:text-base tracking-wide">Offer expires in: <span className="font-black tabular-nums">{formatTime(timeLeft)}</span></span>
                    </div>

                    {/* Items List */}
                    <div className="mt-8 space-y-3 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between text-sm text-gray-800 font-bold border-b border-gray-200/60 pb-3">
                            <div className="flex items-center gap-2 truncate max-w-[70%]">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                <span className="truncate">{primaryProduct.name}</span>
                            </div>
                            <span>{currency}{primaryProduct.price}</span>
                        </div>
                        {bundledProducts.map(p => (
                            <div key={p._id} className="flex items-center justify-between text-sm text-gray-600 font-medium pb-2 border-b border-gray-200/40 last:border-0 last:pb-0 pt-1">
                                <div className="flex items-center gap-2 truncate max-w-[70%]">
                                    <Plus className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{p.name}</span>
                                </div>
                                <span>{currency}{p.price}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pricing Summary */}
                    <div className="flex items-end justify-between mt-8 bg-indigo-50/30 p-5 rounded-2xl border border-indigo-50">
                        <div>
                            <span className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider block mb-1">Bundle Total</span>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{currency}{bundlePrice}</span>
                                <span className="text-lg sm:text-xl text-gray-400 line-through font-semibold">{currency}{originalTotal}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg border border-emerald-200 inline-block shadow-sm">
                                Save {currency}{savings}
                            </span>
                        </div>
                    </div>

                    {/* CTAs */}
                    <div className="mt-8 space-y-4">
                        <button 
                            onClick={handleAddBundle}
                            className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white font-black py-4 sm:py-5 rounded-2xl shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out rounded-2xl"></div>
                            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 z-10 group-hover:-translate-y-1 transition-transform duration-300" />
                            <span className="z-10 text-sm sm:text-base tracking-wide">ADD BUNDLE TO CART</span>
                        </button>
                        
                        <button 
                            onClick={() => {
                                addToCart(primaryProduct._id, primarySize || primaryProduct.sizes[0]);
                                onClose();
                                toast.success("Item Added to Cart");
                            }}
                            className="w-full text-xs sm:text-sm font-bold text-gray-400 hover:text-gray-800 transition-colors py-2"
                        >
                            No thanks, just add my single item
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoBundlerModal;
