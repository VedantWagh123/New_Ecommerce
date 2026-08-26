import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { Landmark, PlusCircle, Trash2, CheckCircle2, XCircle, Tag, Globe, Layers, Package, Search } from 'lucide-react';

const BankOffers = () => {
    const [offers, setOffers] = useState([]);
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // New Offer Form State
    const [formData, setFormData] = useState({
        bankName: '',
        badgeText: '',
        offerText: '',
        minPurchase: '',
        terms: '',
        themeColor: 'blue',
        appliesTo: 'ALL_PRODUCTS',          // 'ALL_PRODUCTS' | 'SPECIFIC_CATEGORY' | 'SPECIFIC_PRODUCTS'
        applicableCategory: 'Men',
        applicableProducts: []
    });

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${backendUrl}/api/bank-offer/list?adminView=true`);
            if (res.data.success) {
                setOffers(res.data.offers || []);
            }
        } catch (error) {
            console.error("Fetch Bank Offers Error:", error);
            toast.error("Failed to load bank offers");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/product/list`);
            if (res.data.success) {
                setProducts(res.data.products || []);
            }
        } catch (error) {
            console.error("Fetch Products Error:", error);
        }
    };

    useEffect(() => {
        fetchOffers();
        fetchProducts();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleProductSelection = (productId) => {
        setFormData(prev => {
            const currentList = prev.applicableProducts || [];
            if (currentList.includes(productId)) {
                return { ...prev, applicableProducts: currentList.filter(id => id !== productId) };
            } else {
                return { ...prev, applicableProducts: [...currentList, productId] };
            }
        });
    };

    const handleCreateOffer = async (e) => {
        e.preventDefault();
        if (!formData.bankName || !formData.badgeText || !formData.offerText || !formData.terms) {
            toast.error("Please fill all required fields");
            return;
        }

        if (formData.appliesTo === 'SPECIFIC_PRODUCTS' && formData.applicableProducts.length === 0) {
            toast.error("Please select at least one product for this offer");
            return;
        }

        try {
            setSubmitting(true);
            const res = await axios.post(`${backendUrl}/api/bank-offer/add`, formData);
            if (res.data.success) {
                toast.success(res.data.message || "Bank Offer Created!");
                setFormData({
                    bankName: '',
                    badgeText: '',
                    offerText: '',
                    minPurchase: '',
                    terms: '',
                    themeColor: 'blue',
                    appliesTo: 'ALL_PRODUCTS',
                    applicableCategory: 'Men',
                    applicableProducts: []
                });
                fetchOffers();
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            console.error("Add Offer Error:", error);
            toast.error(error.message || "Failed to create offer");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await axios.post(`${backendUrl}/api/bank-offer/toggle`, { id });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchOffers();
            }
        } catch (error) {
            toast.error("Failed to toggle offer status");
        }
    };

    const handleDeleteOffer = async (id) => {
        if (!window.confirm("Are you sure you want to delete this bank offer?")) return;
        try {
            const res = await axios.post(`${backendUrl}/api/bank-offer/delete`, { id });
            if (res.data.success) {
                toast.success("Offer deleted successfully");
                fetchOffers();
            }
        } catch (error) {
            toast.error("Failed to delete offer");
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
        p.category.toLowerCase().includes(productSearch.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                        <Landmark className="w-7 h-7 text-indigo-600" />
                        <span>Bank Offers Manager</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Create and target bank payment offers to All Products, Specific Categories, or Selected Products.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Live Store Connected
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Create Offer Form with Product Scope Selector */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5 lg:col-span-1 h-fit">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                        <PlusCircle className="w-5 h-5 text-indigo-600" />
                        <span>Add New Bank Offer</span>
                    </h2>

                    <form onSubmit={handleCreateOffer} className="space-y-4 text-xs">
                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Bank Name *</label>
                            <input
                                required
                                type="text"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleChange}
                                placeholder="e.g. HDFC BANK, ICICI BANK"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Badge Tag Text *</label>
                            <input
                                required
                                type="text"
                                name="badgeText"
                                value={formData.badgeText}
                                onChange={handleChange}
                                placeholder="e.g. 10% OFF or FLAT ₹750 OFF"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Offer Description *</label>
                            <textarea
                                required
                                rows={2}
                                name="offerText"
                                value={formData.offerText}
                                onChange={handleChange}
                                placeholder="e.g. 10% Instant Discount up to ₹1,500 on HDFC Cards & EMI."
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        {/* PRODUCT SELECTION / SCOPE FIELD */}
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                            <label className="font-bold text-slate-900 block flex items-center gap-1.5 text-xs">
                                <Package className="w-4 h-4 text-indigo-600" />
                                <span>Select Product Scope *</span>
                            </label>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                    <input
                                        type="radio"
                                        name="appliesTo"
                                        value="ALL_PRODUCTS"
                                        checked={formData.appliesTo === 'ALL_PRODUCTS'}
                                        onChange={handleChange}
                                        className="accent-indigo-600"
                                    />
                                    <span>🌐 Apply to All Products in Store</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                    <input
                                        type="radio"
                                        name="appliesTo"
                                        value="SPECIFIC_CATEGORY"
                                        checked={formData.appliesTo === 'SPECIFIC_CATEGORY'}
                                        onChange={handleChange}
                                        className="accent-indigo-600"
                                    />
                                    <span>🏷️ Apply to Specific Category</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                    <input
                                        type="radio"
                                        name="appliesTo"
                                        value="SPECIFIC_PRODUCTS"
                                        checked={formData.appliesTo === 'SPECIFIC_PRODUCTS'}
                                        onChange={handleChange}
                                        className="accent-indigo-600"
                                    />
                                    <span>📦 Apply to Specific Selected Products</span>
                                </label>
                            </div>

                            {/* Category Selector Sub-Option */}
                            {formData.appliesTo === 'SPECIFIC_CATEGORY' && (
                                <div className="pt-2 border-t border-slate-200 animate-fade-in">
                                    <label className="font-bold text-slate-700 block mb-1">Target Category</label>
                                    <select
                                        name="applicableCategory"
                                        value={formData.applicableCategory}
                                        onChange={handleChange}
                                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white font-bold"
                                    >
                                        <option value="Men">Men</option>
                                        <option value="Women">Women</option>
                                        <option value="Kids">Kids</option>
                                    </select>
                                </div>
                            )}

                            {/* Specific Products Multi-Select Sub-Option */}
                            {formData.appliesTo === 'SPECIFIC_PRODUCTS' && (
                                <div className="pt-2 border-t border-slate-200 space-y-2 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <label className="font-bold text-slate-700">
                                            Select Products ({formData.applicableProducts.length} selected)
                                        </label>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search product..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-[11px] pr-7 bg-white"
                                        />
                                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                                    </div>

                                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-white space-y-1">
                                        {filteredProducts.map(prod => {
                                            const isChecked = formData.applicableProducts.includes(prod._id);
                                            return (
                                                <div
                                                    key={prod._id}
                                                    onClick={() => toggleProductSelection(prod._id)}
                                                    className={`p-1.5 rounded-lg flex items-center gap-2 cursor-pointer text-[11px] transition-colors ${
                                                        isChecked ? 'bg-indigo-50 border border-indigo-200 font-bold text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {}}
                                                        className="accent-indigo-600 pointer-events-none"
                                                    />
                                                    <img src={prod.image?.[0]} alt="" className="w-6 h-6 object-cover rounded" />
                                                    <span className="truncate flex-1">{prod.name} (₹{prod.price})</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Min Purchase (₹)</label>
                                <input
                                    type="number"
                                    name="minPurchase"
                                    value={formData.minPurchase}
                                    onChange={handleChange}
                                    placeholder="e.g. 3000"
                                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Theme Color</label>
                                <select
                                    name="themeColor"
                                    value={formData.themeColor}
                                    onChange={handleChange}
                                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white font-semibold"
                                >
                                    <option value="blue">Blue (HDFC)</option>
                                    <option value="amber">Amber (ICICI)</option>
                                    <option value="rose">Rose (Axis)</option>
                                    <option value="teal">Teal (UPI / Paytm)</option>
                                    <option value="indigo">Indigo (Standard)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Terms & Conditions *</label>
                            <textarea
                                required
                                rows={3}
                                name="terms"
                                value={formData.terms}
                                onChange={handleChange}
                                placeholder="Detailed terms for modal view..."
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>{submitting ? 'Creating Offer...' : 'Save Bank Offer'}</span>
                        </button>
                    </form>
                </div>

                {/* Right Column: Existing Offers Table / Cards with Scope Display */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5 lg:col-span-2">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-indigo-600" />
                            <span>Live Bank Offers ({offers.length})</span>
                        </h2>
                        <button onClick={fetchOffers} className="text-xs font-bold text-indigo-600 hover:underline">
                            Refresh List
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-16 text-center">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-slate-500 font-medium mt-3">Loading bank offers...</p>
                        </div>
                    ) : offers.length === 0 ? (
                        <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-200/80 p-6">
                            <p className="text-sm font-bold text-slate-700">No Bank Offers Found</p>
                            <p className="text-xs text-slate-500 mt-1">Use the form on the left to add your first dynamic bank offer.</p>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {offers.map((offer) => {
                                let scopeLabel = '🌐 All Products';
                                if (offer.appliesTo === 'SPECIFIC_CATEGORY') {
                                    scopeLabel = `🏷️ Category: ${offer.applicableCategory || 'General'}`;
                                } else if (offer.appliesTo === 'SPECIFIC_PRODUCTS') {
                                    scopeLabel = `📦 ${offer.applicableProducts?.length || 0} Selected Products`;
                                }

                                return (
                                    <div
                                        key={offer._id}
                                        className={`p-4 rounded-2xl border transition-all space-y-2 relative ${
                                            offer.isActive 
                                                ? 'bg-slate-50/70 border-slate-200/80 hover:border-indigo-300' 
                                                : 'bg-slate-100/50 border-slate-200 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-black text-xs px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-200">
                                                    {offer.bankName}
                                                </span>
                                                <span className="font-bold text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                                    {offer.badgeText}
                                                </span>
                                                <span className="font-bold text-[11px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                                                    {scopeLabel}
                                                </span>
                                                {offer.minPurchase > 0 && (
                                                    <span className="text-[11px] text-slate-500 font-medium">
                                                        Min: ₹{offer.minPurchase}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(offer._id)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                        offer.isActive 
                                                            ? 'bg-emerald-500 text-white shadow-2xs' 
                                                            : 'bg-slate-300 text-slate-700'
                                                    }`}
                                                >
                                                    {offer.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                    <span>{offer.isActive ? 'Active' : 'Inactive'}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteOffer(offer._id)}
                                                    className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                                    title="Delete Offer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs font-bold text-slate-800 leading-snug">
                                            {offer.offerText}
                                        </p>

                                        <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                                            <span className="font-bold text-slate-700 block mb-0.5">Terms & Conditions:</span>
                                            {offer.terms}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BankOffers;
