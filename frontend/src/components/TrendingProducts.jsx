import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import Title from './Title';
import ProductItem from './ProductItem';
import { ShopContext } from '../context/ShopContext';

const TrendingProducts = () => {
  const { backendUrl } = useContext(ShopContext);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveTrending = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${backendUrl}/api/trending/active`);
        if (res.data.success) {
          setTrendingProducts(res.data.products || []);
        }
      } catch (error) {
        console.error('Fetch Trending Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (backendUrl) {
      fetchActiveTrending();
    }
  }, [backendUrl]);

  if (!loading && trendingProducts.length === 0) {
    return null; // Hide cleanly if 0 active trending products configured
  }

  return (
    <div className='my-14 px-4 sm:px-6 lg:px-8'>
      {/* Title Header */}
      <div className='text-center py-6 text-3xl font-bold'>
        <div className='inline-flex items-center gap-2 mb-1 px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-xs font-bold uppercase tracking-wider'>
          <span className='w-2 h-2 rounded-full bg-orange-500 animate-ping' />
          🔥 Live Now
        </div>
        <Title text1={'TRENDING'} text2={'SELECTIONS'} />
        <p className='w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600 font-light max-w-xl mt-1'>
          Discover our hottest hand-picked styles trending across our fashion store today.
        </p>
      </div>

      {/* Product Grid */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
        {loading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className='animate-pulse bg-gray-100 rounded-lg aspect-[3/4]' />
          ))
        ) : (
          trendingProducts.map((item) => (
            <div key={item._id} className='relative group'>
              <div className='absolute top-2 left-2 z-20 pointer-events-none'>
                <span className='px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md flex items-center gap-1 uppercase tracking-wider'>
                  🔥 Hot
                </span>
              </div>
              <ProductItem
                id={item._id}
                image={item.image}
                name={item.name}
                price={item.price}
                description={item.description}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrendingProducts;
