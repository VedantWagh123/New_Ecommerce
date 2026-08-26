import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link, useNavigate } from 'react-router-dom'

const FeaturedProducts = () => {
    const { products, currency, toggleWishlist, isInWishlist } = useContext(ShopContext);
    const [featured, setFeatured] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        setFeatured(products.filter(item => item.isFeatured).slice(0, 4));
    }, [products]);

    if (featured.length === 0) return null;

    return (
        <section className="bg-white py-8 sm:py-12 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Featured Products</h2>
                    <span 
                        onClick={() => navigate('/collection')}
                        className="text-blue-600 font-medium cursor-pointer hover:underline text-sm sm:text-base flex items-center gap-1"
                    >
                        View All 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {featured.map((item, index) => {
                        const inWishlist = isInWishlist(item._id);
                        const originalPrice = (item.price * 1.25).toFixed(2);
                        const discount = Math.round(((originalPrice - item.price) / originalPrice) * 100);

                        return (
                            <Link 
                                key={index} 
                                to={`/product/${item._id}`}
                                className="flex items-center p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group"
                            >
                                {/* Badges */}
                                <div className="absolute top-4 left-4 z-10">
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                                        -{discount}%
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleWishlist(item._id);
                                    }}
                                    className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-colors ${
                                        inWishlist ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>

                                {/* Image */}
                                <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden mr-4">
                                    <img src={item.image[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-center">
                                    <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2">{item.name}</h3>
                                    
                                    {/* Rating Mock */}
                                    <div className="flex items-center mt-1">
                                        <div className="flex text-yellow-400 text-[10px] sm:text-xs">
                                            <span>★</span><span>★</span><span>★</span><span>★</span><span className="text-gray-300">★</span>
                                        </div>
                                        <span className="text-xs text-gray-500 ml-1">(1,234)</span>
                                    </div>

                                    {/* Price and Cart */}
                                    <div className="flex items-end justify-between mt-2">
                                        <div>
                                            <span className="text-lg font-bold text-gray-900">{currency}{item.price}</span>
                                            <span className="text-xs text-gray-400 line-through ml-2">{currency}{originalPrice}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                navigate(`/product/${item._id}`);
                                            }}
                                            className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default FeaturedProducts
