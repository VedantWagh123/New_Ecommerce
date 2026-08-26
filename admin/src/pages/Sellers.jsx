import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Sellers = ({ token }) => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchSellers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/api/user/sellers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSellers(response.data.sellers);
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
            fetchSellers();
        }
    }, [token]);

    const handleApprove = async (sellerId) => {
        try {
            const response = await axios.post(`${backendUrl}/api/user/seller/approve`, { sellerId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                fetchSellers();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleReject = async (sellerId) => {
        try {
            const response = await axios.post(`${backendUrl}/api/user/seller/reject`, {
                sellerId,
                reason: rejectReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                setRejectingId(null);
                setRejectReason('');
                fetchSellers();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDeleteSeller = async (sellerId, storeName) => {
        if (!window.confirm(`Are you sure you want to permanently delete seller "${storeName}"? This will remove their account and all associated products.`)) {
            return;
        }
        try {
            const response = await axios.post(`${backendUrl}/api/user/seller/delete`, { sellerId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                fetchSellers();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const filteredSellers = sellers.filter(s => {
        if (filterStatus === 'all') return true;
        return s.sellerStatus === filterStatus;
    });

    return (
        <div className="p-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Seller Approval & Management</h1>
                    <p className="text-sm text-gray-500">Review seller registration applications, approve stores, or manage active sellers.</p>
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map(status => (
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
                <div className="flex justify-center py-12 text-gray-400">Loading sellers...</div>
            ) : filteredSellers.length === 0 ? (
                <div className="bg-white border rounded-xl p-8 text-center text-gray-500">
                    No sellers found matching "{filterStatus}" filter.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredSellers.map((seller) => (
                        <div key={seller._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow transition-all">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl flex-shrink-0 border border-blue-100">
                                        {seller.storeName ? seller.storeName.charAt(0).toUpperCase() : 'S'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-gray-900">{seller.storeName || seller.name}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                seller.sellerStatus === 'approved'
                                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                                    : seller.sellerStatus === 'pending'
                                                    ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse'
                                                    : 'bg-red-100 text-red-700 border border-red-200'
                                            }`}>
                                                {seller.sellerStatus}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            <span className="font-semibold text-gray-700">Owner:</span> {seller.name} &bull; <span className="font-semibold text-gray-700">Email:</span> {seller.email} &bull; <span className="font-semibold text-gray-700">Phone:</span> {seller.storePhone || 'N/A'}
                                        </p>
                                        {seller.storeDescription && (
                                            <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2.5 rounded border border-gray-100">
                                                {seller.storeDescription}
                                            </p>
                                        )}
                                        {seller.sellerRejectionReason && (
                                            <p className="text-xs text-red-600 mt-2 font-medium">
                                                Rejection reason: {seller.sellerRejectionReason}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                                    {seller.sellerStatus !== 'approved' && (
                                        <button
                                            onClick={() => handleApprove(seller._id)}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                        >
                                            ✓ Approve Seller
                                        </button>
                                    )}
                                    {seller.sellerStatus !== 'rejected' && (
                                        <button
                                            onClick={() => setRejectingId(rejectingId === seller._id ? null : seller._id)}
                                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                        >
                                            ✕ Reject
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteSeller(seller._id, seller.storeName || seller.name)}
                                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        title="Delete Seller Account Permanently"
                                    >
                                        <span>🗑️</span> Remove
                                    </button>
                                </div>
                            </div>

                            {rejectingId === seller._id && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-gray-700">Reason for rejection:</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Provide reason for seller..."
                                            className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                                        />
                                        <button
                                            onClick={() => handleReject(seller._id)}
                                            className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold"
                                        >
                                            Confirm Reject
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Sellers;
