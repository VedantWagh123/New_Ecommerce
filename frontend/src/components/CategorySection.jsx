import React from 'react';
import { useNavigate } from 'react-router-dom';

const categoryData = [
  {
    id: 'men',
    title: 'Men',
    tagline: 'Classic & Modern',
    categoryName: 'Men',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'women',
    title: 'Women',
    tagline: 'Elegance & Comfort',
    categoryName: 'Women',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'kids',
    title: 'Kids',
    tagline: 'Playful Style',
    categoryName: 'Kids',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'footwear',
    title: 'Footwear',
    tagline: 'Step in Style',
    categoryName: 'Footwear',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'accessories',
    title: 'Accessories',
    tagline: 'Finishing Touches',
    categoryName: 'Accessories',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'jewellery',
    title: 'Jewellery',
    tagline: 'Timeless Shine',
    categoryName: 'Jewellery',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'winterwear',
    title: 'Winterwear',
    tagline: 'Warm & Cozy',
    categoryName: 'Winterwear',
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'sportswear',
    title: 'Sportswear',
    tagline: 'Active Fit',
    categoryName: 'Sportswear',
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'ethnicwear',
    title: 'Ethnic Wear',
    tagline: 'Heritage Fashion',
    categoryName: 'Ethnic Wear',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'essentials',
    title: 'Fashion Essentials',
    tagline: 'Daily Must-Haves',
    categoryName: 'Fashion Essentials',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop'
  }
];

const CategorySection = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName) => {
    navigate('/collection', { state: { category: categoryName } });
  };

  return (
    <section className="bg-white py-16 sm:py-24 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Popular Categories</h2>
          <span 
            onClick={() => navigate('/collection')}
            className="text-blue-600 font-medium cursor-pointer hover:underline text-sm sm:text-base flex items-center gap-1"
          >
            View All 
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </span>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categoryData.slice(0, 8).map((cat, index) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.categoryName)}
              className="flex items-center p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                />
              </div>
              <div className="ml-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">{cat.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{cat.tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
