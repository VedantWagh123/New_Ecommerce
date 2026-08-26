import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddReviewModal = ({ isOpen, onClose, product, orderId, backendUrl, token, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [attributes, setAttributes] = useState({
    fit: 5,
    quality: 5,
    comfort: 5,
    material: 5,
    colorAccuracy: 5
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 4) {
      toast.warning("You can upload a maximum of 4 photos.");
      setSelectedFiles(files.slice(0, 4));
    } else {
      setSelectedFiles(files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please write a brief comment for your review.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("productId", product._id || product.id);
      formData.append("orderId", orderId);
      formData.append("rating", rating);
      formData.append("title", title);
      formData.append("comment", comment);
      formData.append("attributes", JSON.stringify(attributes));

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await axios.post(
        `${backendUrl}/api/review/add`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        onReviewSubmitted && onReviewSubmitted();
        onClose();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-100 relative text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
          <img
            src={product.image?.[0] || product.image}
            alt={product.name}
            className="w-14 h-16 object-cover rounded-lg border border-gray-200 bg-gray-50"
          />
          <div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Verified Purchase Review
            </span>
            <h3 className="font-bold text-sm sm:text-base text-gray-900 line-clamp-1 mt-0.5">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 font-light">Order ID: #{orderId?.slice(-8)?.toUpperCase()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Overall Star Rating */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">Overall Rating *</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-2xl transition-transform hover:scale-125 focus:outline-none"
                >
                  <span className={(hoverRating || rating) >= star ? "text-amber-400" : "text-gray-200"}>
                    ★
                  </span>
                </button>
              ))}
              <span className="ml-2 font-semibold text-xs text-gray-600">
                {rating === 5 ? 'Excellent ⭐⭐⭐⭐⭐' :
                 rating === 4 ? 'Very Good ⭐⭐⭐⭐' :
                 rating === 3 ? 'Good ⭐⭐⭐' :
                 rating === 2 ? 'Fair ⭐⭐' : 'Poor ⭐'}
              </span>
            </div>
          </div>

          {/* Attribute Ratings */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2.5">
            <p className="font-bold text-xs uppercase tracking-wider text-gray-700">Rate Product Attributes</p>
            {[
              { key: 'fit', label: 'Fit & Sizing' },
              { key: 'quality', label: 'Fabric & Quality' },
              { key: 'comfort', label: 'Wearing Comfort' },
              { key: 'material', label: 'Material Softness' },
              { key: 'colorAccuracy', label: 'Color Accuracy' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-gray-700 font-medium">{label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAttributes(prev => ({ ...prev, [key]: val }))}
                      className={`w-6 h-6 text-[10px] rounded-md font-bold transition-all ${
                        attributes[key] >= val ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Review Title */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">Headline / Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience (e.g. Perfectly fitted & super comfortable!)"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-black text-xs sm:text-sm"
            />
          </div>

          {/* Detailed Comment */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">Written Review *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={3}
              placeholder="What did you like or dislike about the fabric, fit, or stitching?"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-black text-xs sm:text-sm"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">Add Product Photos (Optional, max 4)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-black"
            />
            {selectedFiles.length > 0 && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                ✓ {selectedFiles.length} photo(s) selected
              </p>
            )}
          </div>

          {/* Submit CTAs */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors text-xs uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white rounded-xl font-bold transition-all text-xs uppercase shadow-md active:scale-98"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReviewModal;
