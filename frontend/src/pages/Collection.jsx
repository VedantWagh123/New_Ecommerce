import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import { useLocation } from 'react-router-dom';

const ALL_CATEGORIES = [
  'Men',
  'Women',
  'Kids',
  'Footwear',
  'Accessories',
  'Jewellery',
  'Winterwear',
  'Sportswear',
  'Ethnic Wear',
  'Fashion Essentials'
];

const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext);
  const location = useLocation();
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState('relavent');

  // Handle category passed via navigation state (e.g. from Homepage CategorySection)
  useEffect(() => {
    if (location.state?.category) {
      setCategory([location.state.category]);
      // Scroll to top of collection smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.state]);

  const toggleCategory = (e) => {
    const val = e.target.value;
    if (category.includes(val)) {
      setCategory(prev => prev.filter(item => item !== val));
    } else {
      setCategory(prev => [...prev, val]);
    }
  };

  const toggleSubCategory = (e) => {
    const val = e.target.value;
    if (subCategory.includes(val)) {
      setSubCategory(prev => prev.filter(item => item !== val));
    } else {
      setSubCategory(prev => [...prev, val]);
    }
  };

  const applyFilter = () => {
    let productsCopy = products.slice();

    // Search input filter
    if (showSearch && search) {
      productsCopy = productsCopy.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
    }

    // Category filter (Strict category matching so Men, Women, & Kids sections stay 100% separated)
    if (category.length > 0) {
      productsCopy = productsCopy.filter(item => {
        const itemCat = (item.category || '').trim().toLowerCase();
        const itemSub = (item.subCategory || '').trim().toLowerCase();

        return category.some(cat => {
          const selectedCat = cat.trim().toLowerCase();

          // 1. Exact Category or SubCategory match
          if (itemCat === selectedCat || itemSub === selectedCat) {
            return true;
          }

          // 2. Fallback for non-gender categories (e.g. Footwear, Accessories, Jewellery, Sportswear, Ethnic Wear)
          if (!['men', 'women', 'kids'].includes(selectedCat)) {
            const itemName = (item.name || '').toLowerCase();
            const itemDesc = (item.description || '').toLowerCase();
            return itemName.includes(selectedCat) || itemDesc.includes(selectedCat);
          }

          return false;
        });
      });
    }

    // SubCategory / Type filter
    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter(item => {
        const pSub = (item.subCategory || '').toLowerCase();
        return subCategory.some(sub => pSub === sub.toLowerCase());
      });
    }

    setFilterProducts(productsCopy);
  };

  const sortProduct = () => {
    let fpCopy = filterProducts.slice();

    switch (sortType) {
      case 'low-high':
        setFilterProducts(fpCopy.sort((a, b) => (a.price - b.price)));
        break;

      case 'high-low':
        setFilterProducts(fpCopy.sort((a, b) => (b.price - a.price)));
        break;

      default:
        applyFilter();
        break;
    }
  };

  useEffect(() => {
    applyFilter();
  }, [category, subCategory, search, showSearch, products]);

  useEffect(() => {
    sortProduct();
  }, [sortType]);

  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t min-h-[60vh]'>
      
      {/* Filter Options Sidebar */}
      <div className='min-w-60'>
        <p onClick={() => setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2 font-medium'>
          FILTERS
          <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt="" />
        </p>

        {/* Selected Active Category Badge Indicator */}
        {category.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-500 font-light">Active:</span>
            {category.map(c => (
              <span key={c} className="text-xs bg-gray-900 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                {c}
                <button
                  onClick={() => setCategory(prev => prev.filter(item => item !== c))}
                  className="hover:text-amber-300 ml-0.5"
                >
                  ✕
                </button>
              </span>
            ))}
            <button
              onClick={() => setCategory([])}
              className="text-[11px] text-gray-500 hover:text-black underline ml-1"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Category Filter Checkboxes */}
        <div className={`border border-gray-200 rounded-xl pl-5 pr-4 py-4 mt-2 ${showFilter ? '' : 'hidden'} sm:block bg-white shadow-2xs`}>
          <p className='mb-3 text-xs font-semibold text-gray-900 uppercase tracking-wider'>CATEGORIES</p>
          <div className='flex flex-col gap-2.5 text-xs font-light text-gray-700 max-h-72 overflow-y-auto pr-1'>
            {ALL_CATEGORIES.map(cat => (
              <label key={cat} className='flex items-center gap-2.5 cursor-pointer hover:text-black transition-colors'>
                <input
                  className='w-3.5 h-3.5 accent-gray-900 rounded cursor-pointer'
                  type="checkbox"
                  value={cat}
                  checked={category.includes(cat)}
                  onChange={toggleCategory}
                />
                <span className={category.includes(cat) ? 'font-medium text-gray-900' : ''}>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* SubCategory Type Filter */}
        <div className={`border border-gray-200 rounded-xl pl-5 pr-4 py-4 my-5 ${showFilter ? '' : 'hidden'} sm:block bg-white shadow-2xs`}>
          <p className='mb-3 text-xs font-semibold text-gray-900 uppercase tracking-wider'>TYPE</p>
          <div className='flex flex-col gap-2.5 text-xs font-light text-gray-700'>
            {['Topwear', 'Bottomwear', 'Winterwear'].map(sub => (
              <label key={sub} className='flex items-center gap-2.5 cursor-pointer hover:text-black transition-colors'>
                <input
                  className='w-3.5 h-3.5 accent-gray-900 rounded cursor-pointer'
                  type="checkbox"
                  value={sub}
                  checked={subCategory.includes(sub)}
                  onChange={toggleSubCategory}
                />
                <span className={subCategory.includes(sub) ? 'font-medium text-gray-900' : ''}>{sub}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Main Product Grid Display */}
      <div className='flex-1'>
        <div className='flex justify-between text-base sm:text-2xl mb-6 items-center'>
          <Title text1={category.length === 1 ? category[0].toUpperCase() : 'ALL'} text2={'COLLECTIONS'} />
          
          {/* Product Sort Dropdown */}
          <select
            onChange={(e) => setSortType(e.target.value)}
            className='border border-gray-300 text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-white outline-none font-light'
          >
            <option value="relavent">Sort by: Relevant</option>
            <option value="low-high">Sort by: Price (Low to High)</option>
            <option value="high-low">Sort by: Price (High to Low)</option>
          </select>
        </div>

        {/* Product Cards Grid */}
        {filterProducts.length > 0 ? (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 gap-y-4 sm:gap-4 sm:gap-y-6'>
            {filterProducts.map((item, index) => (
              <ProductItem
                key={item._id || index}
                name={item.name}
                id={item._id}
                price={item.price}
                image={item.image}
                description={item.description}
              />
            ))}
          </div>
        ) : (
          /* Empty Filter Fallback */
          <div className="py-16 text-center bg-gray-50 rounded-2xl border border-gray-200/80 px-4 my-4">
            <p className="text-base font-medium text-gray-800 mb-1">
              No products found matching "{category.join(', ')}"
            </p>
            <p className="text-xs text-gray-500 font-light mb-4">
              Try clearing your filters or selecting another category from above.
            </p>
            <button
              onClick={() => { setCategory([]); setSubCategory([]); }}
              className="text-xs bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl transition-colors font-medium"
            >
              View All Products
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default Collection;
