import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { Flame, Clock, Zap, Save, CheckCircle2, AlertCircle, RefreshCw, Search, Plus, Trash2 } from 'lucide-react';

const FlashSaleManager = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [allProducts, setAllProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Flash Sale State
    const [isActive, setIsActive] = useState(true);
    const [title, setTitle] = useState('LIMITED TIME MIDNIGHT SALE');
    const [subtitle, setSubtitle] = useState('Exclusive Flash Deals — Up to 40% OFF');
    const [endTime, setEndTime] = useState('');
    const [stockClaimedPercent, setStockClaimedPercent] = useState(85);
    const [selectedProducts, setSelectedProducts] = useState([]); // Array of { productId, discountPercent, allocatedStock, claimedStock }

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch catalog products
            const prodRes = await axios.get(`${backendUrl}/api/product/list`);
            if (prodRes.data.success) {
                setAllProducts(prodRes.data.products || []);
            }

            // Fetch flash sale config
            const flashRes = await axios.get(`${backendUrl}/api/flash-sale/active`);
            if (flashRes.data.success && flashRes.data.flashSale) {
                const fs = flashRes.data.flashSale;
                setIsActive(fs.isActive ?? true);
                setTitle(fs.title || 'LIMITED TIME MIDNIGHT SALE');
                setSubtitle(fs.subtitle || 'Exclusive Flash Deals — Up to 40% OFF');
                setStockClaimedPercent(fs.stockClaimedPercent || 85);

                if (fs.endTime) {
                    const d = new Date(fs.endTime);
                    setEndTime(d.toISOString().slice(0, 16));
                } else {
                    const defaultEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    setEndTime(defaultEnd.toISOString().slice(0, 16));
                }

                if (Array.isArray(fs.selectedProducts) && fs.selectedProducts.length > 0) {
                    const items = fs.selectedProducts.map(p => ({
                        productId: p.productId?._id || p.productId,
                        discountPercent: p.discountPercent || 35,
                        allocatedStock: p.allocatedStock || 50,
                        claimedStock: p.claimedStock || 42
                    }));
                    setSelectedProducts(items);
                }
            }
        } catch (error) {
            console.error("Fetch Flash Sale Error:", error);
            toast.error("Failed to load Flash Sale settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Quick Duration Setter (e.g. +2 Hours, +6 Hours, +24 Hours)
    const setQuickDuration = (hours) => {
        const target = new Date(Date.now() + hours * 60 * 60 * 1000);
        setEndTime(target.toISOString().slice(0, 16));
    };

    // Toggle product in selected list
    const toggleProductSelection = (productId) => {
        const exists = selectedProducts.find(p => p.productId === productId);
        if (exists) {
            setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
        } else {
            setSelectedProducts([...selectedProducts, {
                productId,
                discountPercent: 35,
                allocatedStock: 50,
                claimedStock: 42
            }]);
        }
    };

    // Update specific product setting
    const updateProductMeta = (productId, field, value) => {
        setSelectedProducts(selectedProducts.map(p => {
            if (p.productId === productId) {
                return { ...p, [field]: Number(value) };
            }
            return p;
        }));
    };

    const handleSave = async () => {
        if (selectedProducts.length === 0) {
            toast.error("Please select at least 1 product for the Flash Sale!");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                title,
                subtitle,
                isActive,
                endTime: new Date(endTime).toISOString(),
                stockClaimedPercent,
                selectedProducts
            };

            const res = await axios.post(`${backendUrl}/api/flash-sale/update`, payload);
            if (res.data.success) {
                toast.success("🔥 Flash Sale Timer & Products updated live on Homepage!");
                fetchData();
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            console.error("Save Flash Sale Error:", error);
            toast.error("Failed to save Flash Sale settings");
        } finally {
            setSaving(false);
        }
    };

    const filteredCatalog = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                        <Flame className="w-7 h-7 text-rose-600 fill-rose-600 animate-bounce" />
                        <span>Homepage Flash Sale Manager</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Select specific products, set countdown sale timers, and control stock claimed progress bar.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-black hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4 text-amber-400" />
                        <span>{saving ? 'Saving...' : 'SAVE FLASH SALE CONFIG'}</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-medium mt-3">Loading catalog & settings...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT PANEL: CONFIGURATION & DURATION */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Status Toggle Card */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-slate-900">Flash Sale Status</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>
                            <p className="text-xs text-slate-500">
                                {isActive ? '🟢 Flash Sale banner is ACTIVE on Homepage' : '🔴 Flash Sale banner is HIDDEN from Homepage'}
                            </p>
                        </div>

                        {/* Timer & Duration Card */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <Clock className="w-4 h-4 text-amber-500" />
                                <span>Flash Sale Expiry Timer</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 block">End Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                                />
                            </div>

                            {/* Quick Preset Buttons */}
                            <div className="space-y-1.5 pt-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase block">Quick Duration Presets</span>
                                <div className="grid grid-cols-4 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setQuickDuration(2)}
                                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-all"
                                    >
                                        +2 Hrs
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickDuration(6)}
                                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-all"
                                    >
                                        +6 Hrs
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickDuration(12)}
                                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-all"
                                    >
                                        +12 Hrs
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickDuration(24)}
                                        className="px-2 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold rounded-lg transition-all"
                                    >
                                        +24 Hrs
                                    </button>
                                </div>
                            </div>

                            {/* Stock Bar % Setter */}
                            <div className="space-y-2 pt-2 border-t">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                    <span>Warehouse Stock Claimed %</span>
                                    <span className="text-rose-600 font-extrabold">{stockClaimedPercent}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="95"
                                    value={stockClaimedPercent}
                                    onChange={(e) => setStockClaimedPercent(Number(e.target.value))}
                                    className="w-full accent-rose-600"
                                />
                            </div>
                        </div>

                        {/* Titles Card */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Banner Badge Text</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Banner Subtitle</label>
                                <input
                                    type="text"
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: PRODUCT CATALOG SELECTOR */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
                            <div>
                                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <span>Select Flash Sale Products ({selectedProducts.length} Selected)</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Select which products will display in the Flash Sale section on Homepage.
                                </p>
                            </div>

                            <div className="relative w-full sm:w-56">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs pr-8 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                                />
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                            </div>
                        </div>

                        {/* Products List Grid */}
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                            {filteredCatalog.map((prod) => {
                                const isSelected = selectedProducts.some(p => p.productId === prod._id);
                                const selectedMeta = selectedProducts.find(p => p.productId === prod._id) || {};

                                return (
                                    <div
                                        key={prod._id}
                                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                                            isSelected 
                                                ? 'bg-rose-50/50 border-rose-300 shadow-2xs' 
                                                : 'bg-white border-slate-200/80 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleProductSelection(prod._id)}
                                                className="w-4 h-4 accent-rose-600 rounded cursor-pointer shrink-0"
                                            />

                                            <img
                                                src={Array.isArray(prod.image) ? prod.image[0] : prod.image}
                                                alt={prod.name}
                                                className="w-12 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
                                            />

                                            <div className="space-y-0.5 min-w-0">
                                                <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                                                <p className="text-[11px] text-slate-500">
                                                    Category: <span className="font-semibold text-slate-700">{prod.category}</span> • Price: <strong className="text-slate-900">₹{prod.price}</strong>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Per-product Config if Selected */}
                                        {isSelected && (
                                            <div className="flex items-center gap-3 self-end sm:self-center bg-white p-2 rounded-xl border border-rose-200 shrink-0 text-xs">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Discount %</span>
                                                    <input
                                                        type="number"
                                                        value={selectedMeta.discountPercent || 35}
                                                        onChange={(e) => updateProductMeta(prod._id, 'discountPercent', e.target.value)}
                                                        className="w-16 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold text-center"
                                                    />
                                                </div>

                                                <div>
                                                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Claimed</span>
                                                    <input
                                                        type="number"
                                                        value={selectedMeta.claimedStock || 42}
                                                        onChange={(e) => updateProductMeta(prod._id, 'claimedStock', e.target.value)}
                                                        className="w-16 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold text-center"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashSaleManager;
