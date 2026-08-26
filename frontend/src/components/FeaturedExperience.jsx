import React from 'react';
import { useNavigate } from 'react-router-dom';
import featured_1 from '../assets/featured_1.png';
import featured_2 from '../assets/featured_2.png';
import featured_3 from '../assets/featured_3.png';

const banners = [
  {
    image: featured_1,
    label: "NEW COLLECTION",
    title: "Summer Drop",
    tagline: "Experience the warmth of the season with our latest arrivals.",
    link: "/collection"
  },
  {
    image: featured_2,
    label: "EXCLUSIVE",
    title: "New Arrival",
    tagline: "Sophistication redefined in every charcoal stitch.",
    link: "/collection"
  },
  {
    image: featured_3,
    label: "ESSENTIALS",
    title: "Timeless Classics",
    tagline: "Elegance that transcends generations.",
    link: "/collection"
  }
];

const FeaturedExperience = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-10 sm:gap-16 pb-16 sm:pb-24">
      {banners.map((banner, index) => (
        <div 
          key={index}
          className="relative w-full h-[50vh] sm:h-[80vh] overflow-hidden group cursor-pointer"
          onClick={() => navigate(banner.link)}
        >
          {/* Layer 1: Background Image with Zoom Effect */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[3000ms] ease-out group-hover:scale-110 brightness-[0.8] contrast-[1.1] blur-[0.5px]"
            style={{ backgroundImage: `url(${banner.image})` }}
          ></div>

          {/* Layer 2: Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_transparent_30%,_rgba(0,0,0,0.4)_100%)]"></div>

          {/* Layer 3: Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-20 text-white animate-fade-in">
            <div className="max-w-2xl space-y-4 sm:space-y-6 transform transition-transform duration-700 group-hover:-translate-y-2">
              <p className="text-[10px] sm:text-xs tracking-[0.5em] font-light text-white/70 uppercase">
                {banner.label}
              </p>
              <h2 className="text-4xl sm:text-7xl prata-regular leading-tight drop-shadow-2xl">
                {banner.title}
              </h2>
              <p className="text-sm sm:text-lg font-light text-white/80 max-w-md leading-relaxed">
                {banner.tagline}
              </p>
              <div className="pt-6 sm:pt-8">
                <button className="px-8 sm:px-12 py-3 sm:py-4 bg-white text-black text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-all duration-500 shadow-2xl">
                  Explore
                </button>
              </div>
            </div>
          </div>
          
          {/* Subtle Glow on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)] transition-opacity duration-1000"></div>
        </div>
      ))}
    </section>
  );
};

export default FeaturedExperience;
