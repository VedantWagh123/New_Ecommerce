import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';

const ProductApprovals = ({ token }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/api/product/admin-list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setProducts(response.data.products);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchProducts();
        }
    }, [token]);

    const handleApprove = async (productId) => {
        try {
            const response = await axios.post(`${backendUrl}/api/product/approve`, { productId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                fetchProducts();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleReject = async (productId) => {
        try {
            const response = await axios.post(`${backendUrl}/api/product/reject`, {
                productId,
                reason: rejectReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                setRejectingId(null);
                setRejectReason('');
                fetchProducts();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const filteredProducts = products.filter(p => {
        const status = p.approvalStatus || 'approved';
        if (filterStatus === 'all') return true;
        return status === filterStatus;
    });

    return (
        <div className="p-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Product Moderation & Approvals</h1>
                    <p className="text-sm text-gray-500">Review seller submitted items before they go live on the customer website.</p>
                </div>
                <div className="flex gap-2">
                    {['pending', 'approved', 'rejected', 'all'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                                filterStatus === status
                                    ? 'bg-black text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12 text-gray-400">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-white border rounded-xl p-8 text-center text-gray-500">
                    No products found for status "{filterStatus}".
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredProducts.map((item) => {
                        const status = item.approvalStatus || 'approved';
                        return (
                            <div key={item._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={item.image?.[0] || 'https://via.placeholder.com/150'}
                                            alt={item.name}
                                            className="w-20 h-24 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                                        />
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-base font-bold text-gray-900">{item.name}</h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                    status === 'approved'
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : status === 'pending'
                                                        ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse'
                                                        : 'bg-red-100 text-red-700 border border-red-200'
                                                }`}>
                                                    {status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Category: <span className="font-semibold text-gray-700">{item.category}</span> ({item.subCategory}) &bull; Price: <span className="font-bold text-black">{currency}{item.price}</span>
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2 max-w-2xl">
                                                {item.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {item.sizes?.map(s => (
                                                    <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-semibold rounded">
                                                        Size: {s}
                                                    </span>
                                                ))}
                                                {item.sellerId && (
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold rounded">
                                                        Seller Item
                                                    </span>
                                                )}
                                            </div>
                                            {item.rejectionReason && (
                                                <p className="text-xs text-red-600 mt-2 font-medium">
                                                    Rejection note: {item.rejectionReason}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                                        {status !== 'approved' && (
                                            <button
                                                onClick={() => handleApprove(item._id)}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                            >
                                                ✓ Approve Product
                                            </button>
                                        )}
                                        {status !== 'rejected' && (
                                            <button
                                                onClick={() => setRejectingId(rejectingId === item._id ? null : item._id)}
                                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all"
                                            >
                                                ✕ Reject
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {rejectingId === item._id && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                                        <label className="text-xs font-semibold text-gray-700">Reason for rejection:</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                placeholder="Provide feedback for seller..."
                                                className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                                            />
                                            <button
                                                onClick={() => handleReject(item._id)}
                                                className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold"
                                            >
                                                Confirm Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProductApprovals;
