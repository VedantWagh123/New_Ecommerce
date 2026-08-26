import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Flame,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Slash,
  RefreshCw,
  Send,
  Info,
  Store
} from 'lucide-react';
import { backendUrl, currency } from '../App';

const TrendingRequests = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const fetchSellerTrendingData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/trending/seller/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setProducts(res.data.products || []);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load seller trending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSellerTrendingData();
    }
  }, [token]);

  const handleRequestTrending = async (productId) => {
    try {
      setSubmittingId(productId);
      const res = await axios.post(
        `${backendUrl}/api/trending/seller/request`,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        fetchSellerTrendingData();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit trending request');
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-max'><Flame className='w-3.5 h-3.5 text-emerald-600 animate-pulse' /> Active Trending</span>;
      case 'SCHEDULED':
        return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1 w-max'><Calendar className='w-3.5 h-3.5 text-blue-600' /> Scheduled</span>;
      case 'PENDING':
        return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-max'><Clock className='w-3.5 h-3.5 text-amber-600 animate-spin' /> Pending Admin Approval</span>;
      case 'EXPIRED':
        return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1 w-max'><Clock className='w-3.5 h-3.5 text-slate-500' /> Expired</span>;
      case 'REJECTED':
        return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 w-max'><XCircle className='w-3.5 h-3.5 text-rose-600' /> Rejected</span>;
      case 'REMOVED':
        return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300 flex items-center gap-1 w-max'><Slash className='w-3.5 h-3.5 text-gray-500' /> Removed by Admin</span>;
      default:
        return <span className='px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200'>Not Requested</span>;
    }
  };

  return (
    <div className='space-y-6 max-w-6xl mx-auto p-4 sm:p-6'>
      {/* Page Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs'>
        <div>
          <div className='flex items-center gap-2'>
            <span className='p-2.5 rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20'>
              <Flame className='w-6 h-6' />
            </span>
            <div>
              <h1 className='text-xl font-bold text-slate-900'>Request Trending Placement</h1>
              <p className='text-xs text-slate-500'>
                Submit your approved store products for Admin review to appear in the Homepage Trending section.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchSellerTrendingData}
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer self-start md:self-auto'
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Authority Notice */}
      <div className='flex items-start gap-3 p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-indigo-900 text-xs leading-relaxed'>
        <Info className='w-5 h-5 text-indigo-600 shrink-0 mt-0.5' />
        <div>
          <p className='font-bold'>Admin Approval Policy:</p>
          <p className='text-indigo-800 text-[11px] mt-0.5'>
            Sellers can request Trending status for their approved products. Final approval, priority placement, duration (24h to 30d), start dates, and activation are controlled strictly by Admin.
          </p>
        </div>
      </div>

      {/* Seller Products Table */}
      <div className='bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs border-collapse'>
            <thead>
              <tr className='bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold'>
                <th className='py-3.5 px-4'>Product Details</th>
                <th className='py-3.5 px-4'>Approval Status</th>
                <th className='py-3.5 px-4'>Trending Status</th>
                <th className='py-3.5 px-4'>Priority / Schedule</th>
                <th className='py-3.5 px-4 text-right'>Action</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 font-medium text-slate-700'>
              {loading ? (
                <tr>
                  <td colSpan='5' className='py-12 text-center text-slate-400 font-medium'>
                    <RefreshCw className='w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500' />
                    Loading your products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan='5' className='py-12 text-center text-slate-400 font-medium'>
                    No products found in your seller account. Add products to request trending placement.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isPending = p.computedTrendingStatus === 'PENDING';
                  const isActive = p.computedTrendingStatus === 'ACTIVE';

                  return (
                    <tr key={p._id} className='hover:bg-slate-50/60 transition-colors'>
                      <td className='py-3.5 px-4'>
                        <div className='flex items-center gap-3 min-w-[200px]'>
                          <img
                            src={Array.isArray(p.image) ? p.image[0] : p.image}
                            alt={p.name}
                            className='w-11 h-11 object-cover rounded-xl border border-slate-200 bg-slate-100 shrink-0'
                          />
                          <div className='overflow-hidden'>
                            <p className='font-bold text-slate-900 truncate max-w-[180px]'>{p.name}</p>
                            <p className='text-[11px] text-slate-500 font-medium'>
                              {currency}{p.price} • {p.category}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className='py-3.5 px-4 whitespace-nowrap'>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold capitalize ${
                          p.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {p.approvalStatus || 'approved'}
                        </span>
                      </td>

                      <td className='py-3.5 px-4 whitespace-nowrap'>
                        {getStatusBadge(p.computedTrendingStatus)}
                      </td>

                      <td className='py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]'>
                        {p.trending?.priority ? `Priority #${p.trending.priority}` : 'Default Sort'}
                      </td>

                      <td className='py-3.5 px-4 whitespace-nowrap text-right'>
                        {isPending ? (
                          <span className='text-amber-600 font-bold text-xs flex items-center gap-1 justify-end'>
                            <Clock className='w-3.5 h-3.5 animate-spin' /> Waiting Review
                          </span>
                        ) : (
                          <button
                            disabled={submittingId === p._id || p.approvalStatus === 'rejected'}
                            onClick={() => handleRequestTrending(p._id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-2xs'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Send className='w-3.5 h-3.5' />
                            {submittingId === p._id ? 'Submitting...' : (isActive ? 'Re-Request Extension' : 'Request Trending')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrendingRequests;
