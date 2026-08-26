import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';

const CompareModal = ({ isOpen, onClose }) => {
    const { compareList, removeFromCompare, currency, addToCart, navigate } = useContext(ShopContext);

    if (!isOpen || !compareList || compareList.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Product Comparison Matrix</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Comparing {compareList.length} apparel items side-by-side</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Comparison Matrix Table */}
                <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto flex-1">
                    <table className="w-full border-collapse min-w-[600px] text-xs sm:text-sm">
                        <thead>
                            <tr>
                                <th className="p-3 bg-gray-50 border border-gray-200 text-left font-bold text-gray-500 uppercase tracking-wider text-[11px] w-36 shrink-0">
                                    Product
                                </th>
                                {compareList.map((item) => (
                                    <th key={item._id} className="p-4 border border-gray-200 bg-white text-center font-normal align-top min-w-[200px]">
                                        <div className="relative group flex flex-col items-center">
                                            <button
                                                onClick={() => removeFromCompare(item._id)}
                                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 text-xs flex items-center justify-center transition-colors shadow-xs"
                                                title="Remove item"
                                            >
                                                ✕
                                            </button>
                                            <img
                                                src={item.image?.[0]}
                                                alt={item.name}
                                                className="w-24 h-28 object-cover rounded-xl border border-gray-200 shadow-xs mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => {
                                                    navigate(`/product/${item._id}`);
                                                    onClose();
                                                }}
                                            />
                                            <h4 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1">{item.name}</h4>
                                            <p className="text-base font-black text-emerald-600 mb-3">{currency}{item.price}</p>
                                            <button
                                                onClick={() => {
                                                    const firstSize = item.sizes?.[0] || 'M';
                                                    addToCart(item._id, firstSize);
                                                }}
                                                className="bg-black hover:bg-gray-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs w-full"
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-800">
                            {/* Category & Type Row */}
                            <tr>
                                <td className="p-3 bg-gray-50 border border-gray-200 font-bold text-gray-700">Category & Type</td>
                                {compareList.map((item) => (
                                    <td key={item._id} className="p-3 border border-gray-200 text-center font-medium">
                                        {item.category} • {item.subCategory}
                                    </td>
                                ))}
                            </tr>

                            {/* Price Comparison Row */}
                            <tr>
                                <td className="p-3 bg-gray-50 border border-gray-200 font-bold text-gray-700">Price & Discount</td>
                                {compareList.map((item) => (
                                    <td key={item._id} className="p-3 border border-gray-200 text-center">
                                        <span className="font-bold text-gray-900">{currency}{item.price}</span>
                                        <span className="text-xs text-gray-400 line-through ml-1">{currency}{Math.round(item.price * 1.33)}</span>
                                    </td>
                                ))}
                            </tr>

                            {/* Available Sizes Row */}
                            <tr>
                                <td className="p-3 bg-gray-50 border border-gray-200 font-bold text-gray-700">Available Sizes</td>
                                {compareList.map((item) => (
                                    <td key={item._id} className="p-3 border border-gray-200 text-center">
                                        <div className="flex flex-wrap justify-center gap-1">
                                            {item.sizes?.map(sz => (
                                                <span key={sz} className="px-2 py-0.5 bg-gray-100 border text-[11px] font-bold rounded">
                                                    {sz}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                ))}
                            </tr>

                            {/* Return Policy Row */}
                            <tr>
                                <td className="p-3 bg-gray-50 border border-gray-200 font-bold text-gray-700">Return Policy</td>
                                {compareList.map((item) => (
                                    <td key={item._id} className="p-3 border border-gray-200 text-center font-medium text-emerald-700">
                                        {item.returnAvailable ? '7 Days Replacement' : 'No Return'}
                                    </td>
                                ))}
                            </tr>

                            {/* COD Availability Row */}
                            <tr>
                                <td className="p-3 bg-gray-50 border border-gray-200 font-bold text-gray-700">Cash On Delivery</td>
                                {compareList.map((item) => (
                                    <td key={item._id} className="p-3 border border-gray-200 text-center font-medium">
                                        {item.cashOnDelivery ? '✓ COD Available' : '✕ Prepaid Only'}
                                    </td>
                                ))}
                            </tr>

                            {/* Bestseller Tag Row */}
                            <tr>
                                <td className="p-3 bg-gray-50 border border-gray-200 font-bold text-gray-700">Popularity</td>
                                {compareList.map((item) => (
                                    <td key={item._id} className="p-3 border border-gray-200 text-center">
                                        {item.bestseller ? (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">★ Bestseller</span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Standard</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-xl text-xs transition-colors"
                    >
                        Close Matrix
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompareModal;
