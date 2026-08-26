import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { Crown, CheckCircle2, XCircle, Clock, ShieldCheck, RefreshCw, UserCheck, Search, Trash2, CreditCard, Mail, User } from 'lucide-react';

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'active' | 'all'
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${backendUrl}/api/subscription/admin/list`);
            if (res.data.success) {
                setSubscriptions(res.data.subscriptions || []);
            }
        } catch (error) {
            console.error("Fetch Subscriptions Error:", error);
            toast.error("Failed to load subscription requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleApprove = async (id, userName) => {
        try {
            const res = await axios.post(`${backendUrl}/api/subscription/admin/approve`, { id });
            if (res.data.success) {
                toast.success(`👑 VIP Access Approved for ${userName}!`);
                fetchSubscriptions();
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            toast.error("Failed to approve subscription");
        }
    };

    const handleReject = async (id, userName) => {
        const note = window.prompt("Reason for rejection (optional):", "Verification required");
        if (note === null) return;

        try {
            const res = await axios.post(`${backendUrl}/api/subscription/admin/reject`, { id, note });
            if (res.data.success) {
                toast.info(`Subscription rejected for ${userName}`);
                fetchSubscriptions();
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            toast.error("Failed to reject subscription");
        }
    };

    const handleDelete = async (id, userName) => {
        if (!window.confirm(`Are you sure you want to remove VIP Subscription for ${userName}?`)) {
            return;
        }

        try {
            const res = await axios.post(`${backendUrl}/api/subscription/admin/delete`, { id });
            if (res.data.success) {
                toast.info(`VIP Subscription record removed for ${userName}`);
                fetchSubscriptions();
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            toast.error("Failed to remove subscription");
        }
    };

    const pendingCount = subscriptions.filter(s => s.status === 'pending').length;
    const activeCount = subscriptions.filter(s => s.status === 'active' && s.expiryDate > Date.now()).length;

    const filteredSubscriptions = subscriptions.filter(s => {
        const matchesTab = activeTab === 'all' 
            ? true 
            : activeTab === 'pending' 
                ? s.status === 'pending'
                : s.status === 'active';

        const matchesSearch = s.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              s.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (s.userId && s.userId.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesTab && matchesSearch;
    });

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                        <Crown className="w-7 h-7 text-amber-500 fill-amber-500" />
                        <span>VIP Subscriptions Manager</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Review subscriber details, approve requests, or revoke VIP membership privileges.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchSubscriptions}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh List</span>
                    </button>
                </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
                    <div className="flex items-center justify-between text-amber-900 font-bold text-xs">
                        <span>Pending Approvals</span>
                        <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-3xl font-black text-amber-950">{pendingCount}</p>
                    <span className="text-[11px] text-amber-700 font-medium">Awaiting Admin action</span>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between text-emerald-900 font-bold text-xs">
                        <span>Active VIP Members</span>
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-3xl font-black text-emerald-950">{activeCount}</p>
                    <span className="text-[11px] text-emerald-700 font-medium">Enjoying Free Shipping & 10% Off</span>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-1">
                    <div className="flex items-center justify-between text-indigo-900 font-bold text-xs">
                        <span>Total Requests</span>
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-3xl font-black text-indigo-950">{subscriptions.length}</p>
                    <span className="text-[11px] text-indigo-700 font-medium">All time subscriber records</span>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'pending'
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Pending Approvals ({pendingCount})
                        </button>

                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'active'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Active Members ({activeCount})
                        </button>

                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'all'
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            All ({subscriptions.length})
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search user name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs pr-8 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>
                </div>

                {/* Table / Cards List */}
                {loading ? (
                    <div className="py-16 text-center">
                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-slate-500 font-medium mt-3">Loading subscription requests...</p>
                    </div>
                ) : filteredSubscriptions.length === 0 ? (
                    <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-200 p-6">
                        <p className="text-sm font-bold text-slate-700">No Subscriptions Found</p>
                        <p className="text-xs text-slate-500 mt-1">No requests match your current tab or search criteria.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredSubscriptions.map((sub) => {
                            const isPending = sub.status === 'pending';
                            const isActive = sub.status === 'active' && sub.expiryDate > Date.now();

                            return (
                                <div
                                    key={sub._id}
                                    className={`p-5 rounded-2xl border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 ${
                                        isPending
                                            ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                                            : isActive
                                                ? 'bg-emerald-50/40 border-emerald-200'
                                                : 'bg-slate-50 border-slate-200 opacity-75'
                                    }`}
                                >
                                    <div className="space-y-2 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-black text-base text-slate-900 flex items-center gap-1.5">
                                                <User className="w-4 h-4 text-slate-500" />
                                                {sub.userName}
                                            </span>

                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                {sub.userEmail}
                                            </span>
                                            
                                            {/* Status Badge */}
                                            {isPending && (
                                                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Pending Approval
                                                </span>
                                            )}
                                            {isActive && (
                                                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                                    <Crown className="w-3 h-3 text-amber-500 fill-amber-500" /> Active VIP Member
                                                </span>
                                            )}
                                            {sub.status === 'rejected' && (
                                                <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">
                                                    Rejected
                                                </span>
                                            )}
                                        </div>

                                        {/* Subscriber Details Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-slate-200/60">
                                            <div>
                                                <span className="text-[10px] text-slate-400 uppercase font-bold block">User ID</span>
                                                <span className="font-mono text-slate-800 truncate block">{sub.userId}</span>
                                            </div>

                                            <div>
                                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Plan & Payment</span>
                                                <span className="font-bold text-slate-900 flex items-center gap-1">
                                                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                                                    ₹{sub.amount} Trial • {sub.note || '₹1 Payment'}
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Request Date</span>
                                                <span className="font-medium text-slate-700">{new Date(sub.requestDate).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {isActive && (
                                            <p className="text-[11px] text-emerald-800 font-bold bg-emerald-100/70 px-2.5 py-1 rounded-lg inline-block">
                                                ✅ Active VIP Access — Valid until {new Date(sub.expiryDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0 flex-wrap">
                                        {isPending && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(sub._id, sub.userName)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span>Approve VIP Access</span>
                                                </button>

                                                <button
                                                    onClick={() => handleReject(sub._id, sub.userName)}
                                                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    <span>Reject</span>
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={() => handleDelete(sub._id, sub.userName)}
                                            className="bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                            title="Remove Subscription & Revoke VIP Access"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Remove</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Subscriptions;
