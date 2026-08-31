import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { Package, CheckCircle2, XCircle, RefreshCw, Clock, Truck } from 'lucide-react';
import { SocketContext } from '../context/SocketContext';

const Returns = ({ token, searchQuery }) => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket } = React.useContext(SocketContext);

    const fetchReturns = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/seller/return/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setReturns(response.data.returns);
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
            fetchReturns();
        }
    }, [token]);

    useEffect(() => {
        if (socket) {
            socket.on('order-updated', fetchReturns);
            socket.on('new-notification', (notif) => {
                if (notif.title.includes('Return') || notif.title.includes('QC')) {
                    fetchReturns();
                }
            });
            return () => {
                socket.off('order-updated', fetchReturns);
                socket.off('new-notification');
            };
        }
    }, [socket]);

    const handleApprove = async (orderId) => {
        try {
            const response = await axios.post(backendUrl + '/api/seller/return/approve', { orderId }, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.success) {
                toast.success('Return approved. Delivery partner will be assigned.');
                fetchReturns();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleReject = async (orderId) => {
        const reason = window.prompt("Enter rejection reason:");
        if (reason === null) return;

        try {
            const response = await axios.post(backendUrl + '/api/seller/return/reject', { orderId, reason }, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.success) {
                toast.success('Return rejected.');
                fetchReturns();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleQC = async (orderId, passed) => {
        let reason = '';
        if (!passed) {
            reason = window.prompt("Enter reason for QC failure:");
            if (reason === null) return;
        }

        try {
            const response = await axios.post(backendUrl + '/api/seller/return/qc', { orderId, passed, reason }, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.success) {
                toast.success(`QC ${passed ? 'Passed' : 'Failed'} recorded.`);
                fetchReturns();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Requested': return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Requested</span>;
            case 'Approved': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Package className="w-3 h-3" /> Approved</span>;
            case 'In Transit': return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Truck className="w-3 h-3" /> In Transit</span>;
            case 'Received': return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> QC Passed</span>;
            case 'Rejected': return <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
            case 'QC Failed': return <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> QC Failed</span>;
            default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold">{status}</span>;
        }
    };

    const filteredReturns = returns.filter(order => 
        order._id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        order.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Return Requests</h1>
                    <p className="text-sm text-gray-500">Manage customer returns and perform quality checks.</p>
                </div>
                <button onClick={fetchReturns} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors text-gray-600">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white border border-gray-100 rounded-xl animate-pulse" />)}
                </div>
            ) : filteredReturns.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No Return Requests</h3>
                    <p className="text-gray-500 max-w-md mx-auto mt-2">You don't have any pending returns. Keep up the good work!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredReturns.map((order) => (
                        <div key={order._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</p>
                                    <p className="font-mono text-sm font-bold text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
                                </div>
                                {getStatusBadge(order.returnStatus)}
                            </div>
                            
                            <div className="p-5 flex-1">
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 mb-1">Return Reason</p>
                                    <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100">"{order.returnReason || 'No reason provided'}"</p>
                                </div>
                                
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Items Returning</p>
                                <div className="space-y-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <img src={item.image[0]} alt="" className="w-14 h-14 rounded-lg border border-gray-200 object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                                                <p className="text-xs text-gray-500">Qty: {item.quantity} • Size: {item.size}</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5">{currency}{item.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="p-5 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                                {order.returnStatus === 'Requested' && (
                                    <>
                                        <button onClick={() => handleApprove(order._id)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
                                            Approve Pickup
                                        </button>
                                        <button onClick={() => handleReject(order._id)} className="flex-1 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-sm transition-colors shadow-sm">
                                            Reject Request
                                        </button>
                                    </>
                                )}
                                
                                {order.returnStatus === 'Approved' && (
                                    <div className="flex-1 text-center py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-xl border border-amber-100">
                                        Waiting for Wishmaster Assignment & Pickup
                                    </div>
                                )}

                                {order.returnStatus === 'In Transit' && (
                                    <>
                                        <button onClick={() => handleQC(order._id, true)} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
                                            Mark Received & QC Pass
                                        </button>
                                        <button onClick={() => handleQC(order._id, false)} className="flex-1 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-sm transition-colors shadow-sm">
                                            QC Failed
                                        </button>
                                    </>
                                )}
                                
                                {['Received', 'QC Failed', 'Rejected'].includes(order.returnStatus) && (
                                    <div className="flex-1 text-center py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl">
                                        Action Completed
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Returns;
