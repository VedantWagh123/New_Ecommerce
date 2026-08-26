import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import CompareModal from './CompareModal';

const CompareTray = () => {
    const { compareList, removeFromCompare, clearCompare } = useContext(ShopContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!compareList || compareList.length === 0) return null;

    return (
        <>
            <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-4 max-w-2xl w-[92vw] sm:w-full animate-bounce-short">
                <div className="flex items-center gap-3 overflow-x-auto">
                    <span className="text-xs font-bold text-gray-900 shrink-0 hidden sm:inline">
                        Compare ({compareList.length}/4):
                    </span>
                    <div className="flex items-center gap-2">
                        {compareList.map((item) => (
                            <div key={item._id} className="relative group shrink-0">
                                <img
                                    src={item.image?.[0]}
                                    alt={item.name}
                                    className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                    onClick={() => removeFromCompare(item._id)}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black text-white text-[10px] flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"
                                    title="Remove from compare"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={clearCompare}
                        className="text-xs text-gray-500 hover:text-black font-semibold px-2 py-1 transition-colors hidden sm:block"
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-black hover:bg-gray-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
                    >
                        <span>⚖️ Compare Now ({compareList.length})</span>
                    </button>
                </div>
            </div>

            <CompareModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

export default CompareTray;
