import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import {Link} from 'react-router-dom'

const ProductItem = ({id,image,name,price,description}) => {
    
    const {currency, toggleWishlist, isInWishlist} = useContext(ShopContext);
    const [visibleImageIndex, setVisibleImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const inWishlist = isInWishlist(id);

    useEffect(() => {
        let interval;
        if (isHovered && image.length > 1) {
            interval = setInterval(() => {
                setVisibleImageIndex((prev) => (prev + 1) % image.length);
            }, 2000);
        } else {
            setVisibleImageIndex(0);
        }
        return () => clearInterval(interval);
    }, [isHovered, image]);

    const handleWishlistClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(id);
    };

  return (
    <Link onClick={()=>scrollTo(0,0)} 
          onMouseEnter={() => setIsHovered(true)} 
          onMouseLeave={() => setIsHovered(false)} 
          className='text-gray-700 cursor-pointer group relative block' 
          to={`/product/${id}`}>
      <div className='relative overflow-hidden aspect-[3/4] rounded-lg shadow-sm group-hover:shadow-lg transition-all duration-500 bg-gray-50'>
        
        {/* Wishlist Heart Button */}
        <button
            onClick={handleWishlistClick}
            className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center transition-all duration-300 shadow-sm ${
                inWishlist ? 'scale-110 text-rose-500' : 'text-gray-400 hover:text-rose-500 opacity-80 group-hover:opacity-100 hover:scale-110'
            }`}
            title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
            <svg 
                className="w-4 h-4 transition-transform active:scale-125" 
                fill={inWishlist ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        </button>

        {/* Sliding Image Container */}
        <div className='flex w-full h-full transition-transform duration-700 ease-in-out' 
             style={{ transform: `translateX(-${visibleImageIndex * 100}%)` }}>
          {image.map((img, index) => (
            <img key={index} 
                 className='w-full h-full object-cover flex-shrink-0 group-hover:scale-110 transition-transform duration-700' 
                 src={img} 
                 alt={`${name} ${index}`} />
          ))}
        </div>
        
        {/* Premium Description Overlay */}
        <div className='absolute inset-0 bg-black/30 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 z-10'>
          <p className='text-white text-[10px] sm:text-[11px] font-light leading-tight line-clamp-3'>
            {description || "Explore our premium collection, crafted for style and comfort."}
          </p>
        </div>
      </div>
      <div className='pt-2 pb-1'>
        <p className='text-[12px] sm:text-[13px] font-medium truncate'>{name}</p>
        <p className='text-[12px] sm:text-[13px] font-semibold text-black'>{currency}{price}</p>
      </div>
    </Link>
  )
}

export default ProductItem
