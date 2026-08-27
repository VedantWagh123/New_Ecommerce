import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddReviewModal = ({ isOpen, onClose, product, orderId, mode = 'add', backendUrl, token, onReviewSubmitted }) => {
  const [reviewId, setReviewId] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [attributes, setAttributes] = useState({
    fit: 0,
    quality: 0,
    comfort: 0,
    material: 0,
    colorAccuracy: 0
  });
  
  // Hover states for attributes
  const [hoverAttributes, setHoverAttributes] = useState({
    fit: 0,
    quality: 0,
    comfort: 0,
    material: 0,
    colorAccuracy: 0
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (product && mode === 'edit') {
        fetchExistingReview();
      } else if (mode === 'add') {
        resetForm();
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, product, mode]);

  const resetForm = () => {
    setReviewId(null);
    setRating(0);
    setHoverRating(0);
    setTitle('');
    setComment('');
    setAttributes({ fit: 0, quality: 0, comfort: 0, material: 0, colorAccuracy: 0 });
    setHoverAttributes({ fit: 0, quality: 0, comfort: 0, material: 0, colorAccuracy: 0 });
    setSelectedFiles([]);
    setExistingImages([]);
  };

  const fetchExistingReview = async () => {
    try {
      setLoadingData(true);
      const res = await axios.post(
        `${backendUrl}/api/review/user-review`,
        { productId: product._id || product.id, orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.review) {
        const rev = res.data.review;
        setReviewId(rev._id);
        setRating(rev.rating);
        setTitle(rev.title || '');
        setComment(rev.comment);
        if (rev.attributes) {
          setAttributes(rev.attributes);
        }
        setExistingImages(rev.images || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load review data.");
    } finally {
      setLoadingData(false);
    }
  };

  if (!isOpen || !product) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const totalCurrentPhotos = existingImages.length + files.length;
    if (totalCurrentPhotos > 4) {
      toast.warning("You can upload a maximum of 4 photos combined.");
      setSelectedFiles(files.slice(0, Math.max(0, 4 - existingImages.length)));
    } else {
      setSelectedFiles(files);
    }
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeNewImage = (index) => {
      const dt = new DataTransfer();
      const updatedFiles = selectedFiles.filter((_, i) => i !== index);
      updatedFiles.forEach(file => dt.items.add(file));
      setSelectedFiles(updatedFiles);
      
      const inputElement = document.getElementById('review-image-upload');
      if (inputElement) {
          inputElement.files = dt.files;
      }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please provide an overall rating.");
      return;
    }
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

      if (mode === 'edit') {
        formData.append("reviewId", reviewId);
        existingImages.forEach(img => formData.append("existingImages", img));
      }

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const endpoint = mode === 'edit' ? '/api/review/update' : '/api/review/add';
      const response = await axios.post(
        `${backendUrl}${endpoint}`,
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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      setDeleting(true);
      const res = await axios.delete(`${backendUrl}/api/review/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reviewId }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        onReviewSubmitted && onReviewSubmitted();
        onClose();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error("Failed to delete review.");
    } finally {
      setDeleting(false);
    }
  };

  // Custom Star SVG for better visuals
  const StarIcon = ({ filled, className = "w-7 h-7" }) => (
    <svg 
      className={`${className} transition-all duration-200 ${filled ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-100'} drop-shadow-sm`} 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-2xl relative text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-20"
        >
          ✕
        </button>

        {/* Header Section (Fixed at top) */}
        <div className="shrink-0 bg-white z-[5] px-5 sm:px-6 py-4 border-b border-gray-100 shadow-sm rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <img
                src={product.image?.[0] || product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {mode === 'edit' ? 'Edit Verified Review' : 'Verified Purchase'}
              </span>
              <h3 className="font-bold text-base text-gray-900 line-clamp-1">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Order ID: <span className="font-mono text-gray-700">#{orderId?.slice(-8)?.toUpperCase()}</span></p>
            </div>
          </div>
        </div>

        {/* Scrollable Body Section */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 scrollbar-hide">
            {loadingData ? (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-gray-100 border-t-amber-400 rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 mt-4 font-medium animate-pulse">Loading your review...</p>
            </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-7">
                
                {/* Overall Star Rating */}
                <div className="flex flex-col items-center bg-amber-50/50 p-5 rounded-2xl border border-amber-100/50">
                    <label className="block font-bold text-gray-900 text-base mb-3">How would you rate this product?</label>
                    <div className="flex items-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            type="button"
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-110 focus:outline-none"
                        >
                            <StarIcon filled={(hoverRating || rating) >= star} className="w-10 h-10" />
                        </button>
                        ))}
                    </div>
                    {rating > 0 && (
                      <span className="font-bold text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                          {rating === 5 ? 'Excellent' :
                          rating === 4 ? 'Very Good' :
                          rating === 3 ? 'Good' :
                          rating === 2 ? 'Fair' : 'Poor'}
                      </span>
                    )}
                </div>

                {/* Attribute Ratings with Stars */}
                <div>
                    <label className="block font-bold text-gray-900 mb-3 text-sm">Detailed Ratings</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        {[
                            { key: 'fit', label: 'Fit & Sizing' },
                            { key: 'quality', label: 'Fabric & Quality' },
                            { key: 'comfort', label: 'Wearing Comfort' },
                            { key: 'material', label: 'Material Softness' },
                            { key: 'colorAccuracy', label: 'Color Accuracy' }
                        ].map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between">
                            <span className="text-xs text-gray-700 font-semibold">{label}</span>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((val) => (
                                <button
                                    type="button"
                                    key={val}
                                    onClick={() => setAttributes(prev => ({ ...prev, [key]: val }))}
                                    onMouseEnter={() => setHoverAttributes(prev => ({...prev, [key]: val}))}
                                    onMouseLeave={() => setHoverAttributes(prev => ({...prev, [key]: 0}))}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <StarIcon 
                                        filled={(hoverAttributes[key] || attributes[key]) >= val} 
                                        className="w-4 h-4" 
                                    />
                                </button>
                                ))}
                            </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Review Title */}
                    <div>
                    <label className="block font-bold text-gray-900 mb-2 text-sm">Review Headline <span className="text-gray-400 font-normal text-xs">(Optional)</span></label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Summarize your experience (e.g. Perfect fit!)"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 transition-all text-sm"
                    />
                    </div>

                    {/* Detailed Comment */}
                    <div>
                    <label className="block font-bold text-gray-900 mb-2 text-sm">Written Review <span className="text-rose-500">*</span></label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        rows={4}
                        placeholder="What did you like or dislike about the fabric, fit, or stitching?"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 transition-all text-sm resize-none"
                    />
                    </div>
                </div>

                {/* Photo Upload */}
                <div>
                <label className="block font-bold text-gray-900 mb-2 text-sm">Add Photos <span className="text-gray-400 font-normal text-xs">(Max 4)</span></label>
                
                <div className="flex flex-wrap gap-3 mb-3">
                    {/* Existing Images */}
                    {existingImages.map((img, idx) => (
                        <div key={`exist-${idx}`} className="relative group">
                        <img src={img} alt="Existing" className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm" />
                        <button type="button" onClick={() => removeExistingImage(idx)} className="absolute -top-2 -right-2 bg-white text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-100 rounded-full w-6 h-6 flex items-center justify-center transition-colors shadow-sm">✕</button>
                        </div>
                    ))}
                    
                    {/* New Images */}
                    {selectedFiles.map((file, idx) => (
                        <div key={`new-${idx}`} className="relative group">
                        <img src={URL.createObjectURL(file)} alt="New upload" className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm" />
                        <button type="button" onClick={() => removeNewImage(idx)} className="absolute -top-2 -right-2 bg-white text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-100 rounded-full w-6 h-6 flex items-center justify-center transition-colors shadow-sm">✕</button>
                        </div>
                    ))}

                    {/* Upload Button */}
                    {(existingImages.length + selectedFiles.length) < 4 && (
                        <label 
                            htmlFor="review-image-upload" 
                            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-amber-500 hover:border-amber-300 hover:bg-amber-50/50 cursor-pointer transition-all"
                        >
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            <span className="text-[10px] font-semibold">Upload</span>
                        </label>
                    )}
                </div>

                <input
                    id="review-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={existingImages.length + selectedFiles.length >= 4}
                />
                </div>

                {/* Submit CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-6 border-t border-gray-100">
                {mode === 'edit' && (
                    <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting || submitting}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                    {deleting ? (
                        <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Delete Review'}
                    </button>
                )}
                <div className="flex flex-1 gap-3 w-full">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting || deleting}
                        className="flex-1 sm:flex-none sm:w-32 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors text-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || deleting}
                        className="flex-1 py-3.5 bg-black hover:bg-gray-900 disabled:bg-gray-400 text-white rounded-xl font-bold transition-all text-sm shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Submitting...</span>
                            </>
                        ) : mode === 'edit' ? 'Update Review' : 'Submit Review'}
                    </button>
                </div>
                </div>
            </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default AddReviewModal;
