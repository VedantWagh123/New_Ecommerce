import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Reviews = ({ token }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'visible' | 'hidden'

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

  const handleToggleHide = async (reviewId) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/review/admin/toggle-hide`,
        { reviewId },
        { headers: { Authorization: `Bearer ${token}` } }
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
    }
  };

  useEffect(() => {
    fetchAllReviews();
  }, [token]);

  const filteredReviews = reviews.filter(r => {
    if (filter === 'visible') return !r.hidden;
    if (filter === 'hidden') return r.hidden;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Review Management & Moderation</h2>
          <p className="text-xs text-gray-500 font-light">
            Monitor customer reviews, ratings, verified buyer badges, and photo uploads.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2 text-xs font-semibold">
          {['all', 'visible', 'hidden'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg border capitalize transition-all ${
                filter === f
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {f} ({reviews.filter(r => f === 'all' ? true : f === 'visible' ? !r.hidden : r.hidden).length})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-28 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-gray-200 p-6 text-gray-500 text-sm">
          No reviews found under this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev._id}
              className={`p-4 bg-white rounded-xl border transition-all shadow-2xs space-y-3 ${
                rev.hidden ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white font-bold text-xs flex items-center justify-center">
                    {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      {rev.userName}
                      {rev.verifiedPurchase && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                          ✓ Verified Buyer
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Product ID: <code className="font-mono text-gray-700">{rev.productId}</code> • Order: <code className="font-mono text-gray-700">#{rev.orderId?.slice(-8)}</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    {[1, 2, 3, 4, 5].map(st => (
                      <span key={st} className={`text-xs ${st <= rev.rating ? 'text-amber-400' : 'text-gray-200'}`}>
                        ★
                      </span>
                    ))}
                    <span className="ml-1 text-xs font-bold text-amber-900">{rev.rating}/5</span>
                  </div>

                  {/* Moderation Button */}
                  <button
                    onClick={() => handleToggleHide(rev._id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      rev.hidden
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                    }`}
                  >
                    {rev.hidden ? 'Un-hide Review' : 'Hide Review'}
                  </button>
                </div>
              </div>

              {/* Review Content */}
              {rev.title && <p className="text-xs font-bold text-gray-900">{rev.title}</p>}
              <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>

              {/* Attributes & Photos */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                {rev.attributes && (
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">Fit: {rev.attributes.fit}/5</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded">Quality: {rev.attributes.quality}/5</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded">Comfort: {rev.attributes.comfort}/5</span>
                  </div>
                )}

                {rev.images && rev.images.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {rev.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Review photo"
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                      />
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
