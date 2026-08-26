import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl, currency } from '../App';
import { Wallet, DollarSign, TrendingUp, CreditCard, CheckCircle, Clock, XCircle, RefreshCw, Send } from 'lucide-react';

const Finances = ({ token, role }) => {
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  
  const [summary, setSummary] = useState({
    grossSales: 0,
    platformCommission: 0,
    sellerEarnings: 0,
    totalPaid: 0,
    pendingPayables: 0
  });
  
  const [payouts, setPayouts] = useState([]);

  const fetchFinances = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/finance/ledger`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSummary(res.data.summary);
        setPayouts(res.data.payouts || []);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchFinances();
  }, [token]);

  const handleUpdateStatus = async (payoutId, newStatus) => {
    try {
      setUpdatingId(payoutId);
      const res = await axios.post(
        `${backendUrl}/api/finance/payout/update`,
        { payoutId, status: newStatus, note: 'Processed by Admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchFinances(); // refresh data
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update payout status');
    } finally {
      setUpdatingId(null);
    }
  };

  // If role is strictly support or marketing, block access. Empty role means legacy super admin.
  if (role === 'support' || role === 'marketing') {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-rose-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
          <p className="text-slate-500 mt-2">Only Super Admins can access financial records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto space-y-8 animate-fade-in'>
      
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm'>
        <div>
          <div className='flex items-center gap-3'>
            <span className='p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'>
              <Wallet className='w-7 h-7' />
            </span>
            <div>
              <h1 className='text-2xl font-bold text-slate-900'>Finances & Ledger</h1>
              <p className='text-sm text-slate-500 font-medium'>
                Track platform revenue, commissions, and manage seller payouts.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchFinances}
          className='flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors cursor-pointer'
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger
        </button>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {/* Gross Sales */}
        <div className='bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-start gap-4'>
          <div className='p-3.5 bg-blue-50 text-blue-600 rounded-2xl'>
            <TrendingUp className='w-6 h-6' />
          </div>
          <div>
            <p className='text-sm font-semibold text-slate-500'>Gross Platform Sales</p>
            <h3 className='text-2xl font-black text-slate-900 mt-1'>{currency}{summary.grossSales.toLocaleString()}</h3>
            <p className='text-xs font-semibold text-slate-400 mt-1'>From delivered orders</p>
          </div>
        </div>

        {/* Platform Profit */}
        <div className='bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl border border-indigo-900/20 shadow-sm flex items-start gap-4 text-white relative overflow-hidden'>
          <div className='absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl'></div>
          <div className='p-3.5 bg-white/20 text-indigo-100 rounded-2xl backdrop-blur-md'>
            <DollarSign className='w-6 h-6' />
          </div>
          <div className='relative z-10'>
            <p className='text-sm font-semibold text-indigo-100/90'>Platform Profit (10%)</p>
            <h3 className='text-2xl font-black mt-1 text-white'>{currency}{summary.platformCommission.toLocaleString()}</h3>
            <p className='text-xs font-semibold text-indigo-200 mt-1'>Total commission earned</p>
          </div>
        </div>

        {/* Pending Payables */}
        <div className='bg-white p-6 rounded-3xl border border-orange-200 shadow-sm flex items-start gap-4 relative overflow-hidden'>
          <div className='absolute -right-6 -bottom-6 w-24 h-24 bg-orange-100/50 rounded-full blur-2xl'></div>
          <div className='p-3.5 bg-orange-50 text-orange-600 rounded-2xl'>
            <CreditCard className='w-6 h-6' />
          </div>
          <div className='relative z-10'>
            <p className='text-sm font-semibold text-slate-500'>Pending Payables</p>
            <h3 className='text-2xl font-black text-slate-900 mt-1'>{currency}{summary.pendingPayables.toLocaleString()}</h3>
            <p className='text-xs font-bold text-orange-600 mt-1'>To be paid to sellers</p>
          </div>
        </div>

        {/* Total Paid */}
        <div className='bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-start gap-4'>
          <div className='p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl'>
            <CheckCircle className='w-6 h-6' />
          </div>
          <div>
            <p className='text-sm font-semibold text-slate-500'>Total Paid to Sellers</p>
            <h3 className='text-2xl font-black text-slate-900 mt-1'>{currency}{summary.totalPaid.toLocaleString()}</h3>
            <p className='text-xs font-semibold text-slate-400 mt-1'>Lifetime completed payouts</p>
          </div>
        </div>
      </div>

      {/* Payout Requests Table */}
      <div className='bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden'>
        <div className='p-6 border-b border-slate-100 flex items-center justify-between'>
          <h2 className='text-lg font-bold text-slate-900'>Seller Payout Requests</h2>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm border-collapse'>
            <thead>
              <tr className='bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold'>
                <th className='py-4 px-6'>Seller Details</th>
                <th className='py-4 px-6'>Amount</th>
                <th className='py-4 px-6'>Request Date</th>
                <th className='py-4 px-6'>Status</th>
                <th className='py-4 px-6 text-right'>Action</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 font-medium text-slate-700'>
              {loading ? (
                <tr>
                  <td colSpan='5' className='py-12 text-center text-slate-400 font-medium'>
                    <RefreshCw className='w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500' />
                    Loading financial records...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan='5' className='py-12 text-center text-slate-400 font-medium'>
                    No payout requests found.
                  </td>
                </tr>
              ) : (
                payouts.map((p, index) => (
                  <tr key={index} className='hover:bg-slate-50/60 transition-colors'>
                    <td className='py-4 px-6'>
                      <p className='font-bold text-slate-900'>{p.storeName}</p>
                      <p className='text-xs text-slate-500'>{p.email}</p>
                      <p className='text-[10px] text-slate-400 mt-1'>Bank: {p.paymentMethod}</p>
                    </td>
                    <td className='py-4 px-6'>
                      <span className='font-black text-slate-900'>{currency}{p.amount}</span>
                    </td>
                    <td className='py-4 px-6 whitespace-nowrap text-xs text-slate-500'>
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                    <td className='py-4 px-6'>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize border flex items-center gap-1 w-max ${
                        p.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        p.status === 'rejected' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {p.status === 'completed' && <CheckCircle className='w-3.5 h-3.5' />}
                        {p.status === 'pending' && <Clock className='w-3.5 h-3.5 animate-spin-slow' />}
                        {p.status === 'rejected' && <XCircle className='w-3.5 h-3.5' />}
                        {p.status}
                      </span>
                    </td>
                    <td className='py-4 px-6 text-right'>
                      {p.status === 'pending' ? (
                        <div className='flex items-center justify-end gap-2'>
                          <button
                            onClick={() => handleUpdateStatus(p._id, 'completed')}
                            disabled={updatingId === p._id}
                            className='px-3 py-1.5 rounded-lg font-bold text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50'
                          >
                            <Send className='w-3.5 h-3.5' /> Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(p._id, 'rejected')}
                            disabled={updatingId === p._id}
                            className='px-3 py-1.5 rounded-lg font-bold text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50'
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className='text-xs font-semibold text-slate-400'>
                          {p.transactionId ? `Txn: ${p.transactionId}` : 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Finances;
