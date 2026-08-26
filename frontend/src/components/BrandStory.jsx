import React from 'react';
import brand_philosophy from '../assets/brand_philosophy_v3.png';

const BrandStory = () => {
  return (
    <section className="bg-white py-24 sm:py-32 px-6 sm:px-10 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
        
        {/* Left Side: Luxury Editorial Image */}
        <div className="relative group overflow-hidden rounded-2xl shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute -inset-10 bg-gray-50 rounded-full blur-3xl opacity-30 -z-10 group-hover:opacity-50 transition-opacity duration-700"></div>
          
          <div className="aspect-[4/5] sm:aspect-square overflow-hidden">
            <img 
              src={brand_philosophy} 
              alt="Brand Philosophy Editorial" 
              className="w-full h-full object-cover transition-transform duration-[2000ms] ease-in-out group-hover:scale-110"
            />
          </div>
          
          {/* Subtle Light Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent"></div>
        </div>

        {/* Right Side: Editorial Text Content */}
        <div className="flex flex-col space-y-8 animate-fade-in max-w-xl">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="w-8 h-[1px] bg-gray-300"></span>
              <p className="text-gray-400 text-xs sm:text-sm tracking-[0.4em] uppercase font-light">
                Our Philosophy
              </p>
            </div>
            
            <h2 className="text-4xl sm:text-6xl prata-regular text-gray-900 leading-tight">
              Crafted for <br /> Timeless <span className="italic">Elegance</span>
            </h2>
          </div>

          <p className="text-gray-500 text-lg sm:text-xl leading-relaxed font-light">
            We believe in refined simplicity—where every detail speaks of quality, 
            and every piece is designed to last beyond fleeting trends. 
            Our commitment to excellence ensures that each creation is a masterpiece 
            of modern luxury, crafted for those who value the art of subtlety.
          </p>

          <div className="pt-6">
            <button className="text-xs sm:text-sm font-medium tracking-[0.3em] uppercase border-b border-gray-900 pb-3 hover:text-gray-400 hover:border-gray-400 transition-all duration-500 transform hover:translate-x-2">
              Discover Our Roots
            </button>
          </div>
          
          {/* Subtle accent detail */}
          <div className="pt-12 hidden sm:block">
            <p className="text-[10px] text-gray-300 tracking-[0.2em] font-light">
              ESTABLISHED IN 2026 • HANDCRAFTED QUALITY
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default BrandStory;
