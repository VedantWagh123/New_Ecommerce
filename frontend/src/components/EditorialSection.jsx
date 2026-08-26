import React from 'react';
import { useNavigate } from 'react-router-dom';

const EditorialSection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white py-24 sm:py-32 px-6 sm:px-10 border-t border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        
        {/* Left Side: Editorial Image Card */}
        <div className="relative group overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] bg-gray-50 border border-gray-100">
          <div className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop" 
              alt="Designed Around You Editorial" 
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105"
            />
          </div>
          {/* Subtle Light Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Right Side: Editorial Text & CTA */}
        <div className="flex flex-col space-y-8 max-w-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-8 h-[1px] bg-gray-400"></span>
              <p className="text-gray-400 text-xs sm:text-sm tracking-[0.4em] uppercase font-light">
                Curated Luxury
              </p>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl prata-regular text-gray-900 leading-tight">
              Designed Around <br /> <span className="italic">Everyday Living</span>
            </h2>
          </div>

          <p className="text-gray-500 text-base sm:text-lg leading-relaxed font-light">
            Every garment in our catalog is thoughtfully engineered for versatile comfort 
            and modern aesthetic perfection. Experience breathable fabrics, impeccable tailoring, 
            and quiet sophistication crafted to seamlessly elevate your signature style.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-6 pt-2 border-t border-b border-gray-100 py-6 text-xs text-gray-600 font-medium">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                ✓
              </div>
              <span>100% Organic Fabrics</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                ✓
              </div>
              <span>Ergonomic Tailoring</span>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => navigate('/collection')}
              className="group inline-flex items-center gap-3 text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-gray-900 border-b border-gray-900 pb-3 hover:text-gray-500 hover:border-gray-400 transition-all duration-300"
            >
              <span>Explore Collection</span>
              <svg 
                className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default EditorialSection;
