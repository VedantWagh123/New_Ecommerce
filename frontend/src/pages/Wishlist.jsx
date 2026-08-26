import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

const Wishlist = () => {
    const { products, wishlist, currency, toggleWishlist, addToCart, navigate, addToCompare, isInCompare } = useContext(ShopContext);

    const wishlistProducts = products.filter(p => wishlist.includes(p._id));

    return (
        <div className="border-t pt-10 pb-20 min-h-[60vh]">
            <div className="flex items-center justify-between mb-8">
                <div className="text-2xl sm:text-3xl">
                    <Title text1={'MY'} text2={'WISHLIST'} />
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {wishlistProducts.length} {wishlistProducts.length === 1 ? 'Item' : 'Items'} Saved
                </span>
            </div>

            {wishlistProducts.length === 0 ? (
                <div className="py-20 text-center bg-gray-50 rounded-2xl border border-gray-100 max-w-2xl mx-auto p-8">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-rose-500">
                        ❤️
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        Explore our latest collections and tap the heart icon on your favorite items to save them here for later.
                    </p>
                    <button
                        onClick={() => navigate('/collection')}
                        className="bg-black hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all shadow-md active:scale-95"
                    >
                        Explore Collection
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-8">
                    {wishlistProducts.map((product) => (
                        <div key={product._id} className="relative group flex flex-col justify-between bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all">
                            {/* Remove Heart Badge */}
                            <button
                                onClick={() => toggleWishlist(product._id)}
                                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-rose-600 shadow-sm hover:scale-110 transition-transform"
                                title="Remove from wishlist"
                            >
                                ❤️
                            </button>

                            <div>
                                <ProductItem
                                    id={product._id}
                                    name={product.name}
                                    price={product.price}
                                    image={product.image}
                                    description={product.description}
                                />
                            </div>

                            <div className="p-3 pt-0 space-y-2">
                                <button
                                    onClick={() => {
                                        const defaultSize = product.sizes?.[0] || 'M';
                                        addToCart(product._id, defaultSize);
                                        toggleWishlist(product._id);
                                    }}
                                    className="w-full bg-black hover:bg-gray-800 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1"
                                >
                                    <span>Move to Cart</span>
                                </button>

                                <button
                                    onClick={() => addToCompare(product)}
                                    className={`w-full text-xs font-semibold py-1.5 rounded-xl border transition-colors ${
                                        isInCompare(product._id) 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    {isInCompare(product._id) ? '✓ In Compare' : '+ Add to Compare'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
