import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Wallet, DollarSign, ArrowUpRight, Clock, CheckCircle2, Building2, PlusCircle, X } from 'lucide-react';

const currency = '₹';

const Earnings = ({ token }) => {
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    completedPayouts: 0,
    availableBalance: 0
  });
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/seller/earnings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSummary(response.data.summary);
        setPayouts(response.data.payouts || []);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEarnings();
    }
  }, [token]);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (Number(payoutAmount) > summary.availableBalance) {
      toast.error("Requested amount exceeds available balance");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${backendUrl}/api/seller/earnings/payout`, {
        amount: payoutAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowPayoutModal(false);
        setPayoutAmount('');
        fetchEarnings();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Earnings & Payout Ledger</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track gross earnings, pending order funds, and request bank payouts.
          </p>
        </div>

        <button
          onClick={() => setShowPayoutModal(true)}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Request Bank Payout</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Available Balance</span>
          <span className="text-2xl font-extrabold text-slate-900">{currency}{summary.availableBalance.toLocaleString()}</span>
          <span className="text-[10px] text-emerald-600 font-bold block mt-1">Ready for Withdrawal</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Total Earnings</span>
          <span className="text-2xl font-extrabold text-slate-900">{currency}{summary.totalEarnings.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">From Delivered Orders</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Pending Escrow</span>
          <span className="text-2xl font-extrabold text-slate-900">{currency}{summary.pendingEarnings.toLocaleString()}</span>
          <span className="text-[10px] text-amber-600 font-medium block mt-1">In Transit / Packing</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Completed Payouts</span>
          <span className="text-2xl font-extrabold text-slate-900">{currency}{summary.completedPayouts.toLocaleString()}</span>
          <span className="text-[10px] text-blue-600 font-medium block mt-1">Transferred to Bank</span>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Payout Transaction History</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading payout records...</div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No payout requests submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Request ID</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Method</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payouts.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50/80">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      PAY-{p._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {currency}{p.amount}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600">
                      {p.paymentMethod}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900">Request Bank Payout</h3>
              <button onClick={() => setShowPayoutModal(false)} className="p-1.5 text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payout Amount ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={summary.availableBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder={`Max ${summary.availableBalance}`}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Available balance: ${summary.availableBalance}</span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-6 bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  {submitting ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Earnings;
