import React, { useState } from 'react';

const NotifyMeModal = ({ isOpen, onClose, product, selectedSize, onSubscribe }) => {
    if (!isOpen || !product) return null;

    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        const success = onSubscribe(product._id, selectedSize, email);
        setSubmitting(false);
        if (success) {
            setEmail('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 p-6 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 text-xs font-bold">
                        <span>🔔</span> Back In Stock Alert
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors text-xs"
                    >
                        ✕
                    </button>
                </div>

                {/* Product Summary */}
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100 mb-5">
                    <img 
                        src={product.image?.[0]} 
                        alt={product.name} 
                        className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                    />
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{product.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Selected Size: <span className="font-bold text-black uppercase bg-white px-2 py-0.5 rounded border">{selectedSize}</span></p>
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">Currently Out of Stock</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Notify Me When Available</h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            Enter your email address below. We'll automatically send you a notification as soon as <b>Size {selectedSize}</b> is restocked.
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1.5">Email Address</label>
                        <input 
                            type="email" 
                            required
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-black focus:outline-none"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md active:scale-98 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Notify Me'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NotifyMeModal;
