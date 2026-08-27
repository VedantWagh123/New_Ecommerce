import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Reviews = ({ token }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [actionLoading, setActionLoading] = useState(null); // stores reviewId if an action is in progress

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/review/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setReviews(res.data.reviews || []);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reviewId, status) => {
    try {
      setActionLoading(reviewId);
      const res = await axios.post(
        `${backendUrl}/api/review/admin/status`,
        { reviewId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(`Review ${status} successfully!`);
        fetchAllReviews();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      setActionLoading(reviewId);
      const res = await axios.delete(
        `${backendUrl}/api/review/admin/delete`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { reviewId }
        }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchAllReviews();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchAllReviews();
  }, [token]);

  const filteredReviews = reviews.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Review Moderation</h2>
          <p className="text-xs text-gray-500 font-light mt-1">
            Approve, reject, or delete customer reviews. Only approved reviews affect product ratings.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2 text-xs font-semibold flex-wrap">
          {['pending', 'approved', 'rejected', 'all'].map((f) => {
            const count = reviews.filter(r => f === 'all' ? true : r.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg border capitalize transition-all ${
                  filter === f
                    ? 'bg-black text-white border-black shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-32 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center bg-white rounded-2xl border border-gray-200 p-6 text-gray-500">
          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <p className="font-semibold text-gray-800 text-lg">No reviews found</p>
          <p className="text-sm">There are no {filter !== 'all' ? filter : ''} reviews to show.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev._id}
              className={`p-5 bg-white rounded-xl border transition-all shadow-sm flex flex-col gap-3 ${
                rev.status === 'pending' ? 'border-amber-300 bg-amber-50/30' :
                rev.status === 'rejected' ? 'border-rose-200 bg-rose-50/30' :
                'border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-gray-900">{rev.userName}</h4>
                      {rev.verifiedPurchase && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          ✓ Verified
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        rev.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        rev.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {rev.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Product ID: <span className="font-mono text-gray-800">{rev.productId}</span> • Order: <span className="font-mono text-gray-800">#{rev.orderId?.slice(-8)}</span>
                    </p>
                    
                    {/* Rating Stars */}
                    <div className="flex items-center gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map(st => (
                        <span key={st} className={`text-sm ${st <= rev.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                      ))}
                      <span className="ml-1.5 text-xs font-bold text-gray-700">{rev.rating}/5</span>
                    </div>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2 self-start bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                  {rev.status !== 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(rev._id, 'approved')}
                      disabled={actionLoading === rev._id}
                      className="px-3 py-1.5 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {rev.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(rev._id, 'rejected')}
                      disabled={actionLoading === rev._id}
                      className="px-3 py-1.5 text-xs font-bold rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <button
                    onClick={() => handleDelete(rev._id)}
                    disabled={actionLoading === rev._id}
                    className="px-3 py-1.5 text-xs font-bold rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Review Content */}
              <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100 mt-2">
                {rev.title && <p className="text-sm font-bold text-gray-900 mb-1">{rev.title}</p>}
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{rev.comment}</p>
                
                {/* Photos */}
                {rev.images && rev.images.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                    {rev.images.map((img, idx) => (
                      <a href={img} target="_blank" rel="noreferrer" key={idx}>
                        <img
                          src={img}
                          alt="Review attachment"
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      </a>
                    ))}
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

export default Reviews;
