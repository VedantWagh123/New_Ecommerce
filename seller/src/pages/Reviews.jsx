import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Star, MessageSquare, CheckCircle2, User, Image as ImageIcon } from 'lucide-react';

const Reviews = ({ token }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/seller/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReviews(response.data.reviews || []);
        setStats(response.data.stats || { totalReviews: 0, averageRating: 0, distribution: {} });
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
      fetchReviews();
    }
  }, [token]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Product Reviews</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Feedback, star ratings, and photo reviews submitted by verified buyers for your products.
        </p>
      </div>

      {/* Ratings Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-center items-center text-center">
          <span className="text-5xl font-extrabold text-slate-900 mb-2">{stats.averageRating}</span>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(stats.averageRating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500 font-medium">{stats.totalReviews} Total Verified Reviews</span>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Rating Score Distribution</h3>
          {[5, 4, 3, 2, 1].map(stars => {
            const count = stats.distribution?.[stars] || 0;
            const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-bold text-slate-700">{stars} ★</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }}></div>
                </div>
                <span className="w-8 text-right font-medium text-slate-400">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Recent Customer Reviews</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No product reviews received yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map(review => (
              <div key={review._id} className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
                      {review.userName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{review.userName}</span>
                        {review.verifiedPurchase && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {review.title && <h4 className="text-xs font-bold text-slate-900">{review.title}</h4>}
                <p className="text-xs text-slate-600 leading-relaxed">{review.comment}</p>

                {review.images?.length > 0 && (
                  <div className="flex gap-2 pt-2">
                    {review.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Customer photo"
                        onClick={() => setSelectedImage(img)}
                        className="w-14 h-14 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 cursor-pointer"
        >
          <img src={selectedImage} alt="Enlarged" className="max-w-xl max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default Reviews;
