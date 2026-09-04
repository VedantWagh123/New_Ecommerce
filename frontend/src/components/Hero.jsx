import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import hero_luxury from '../assets/hero_luxury.png';

const Hero = () => {
  const navigate = useNavigate();
  const [dodgePos, setDodgePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleDodge = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    let deltaX = cardCenterX - mouseX;
    let deltaY = cardCenterY - mouseY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Increase trigger distance to 200px
    if (distance < 200) {
      if (distance === 0) { deltaX = 1; deltaY = 1; }
      
      const pushFactor = 220; // Jump much further away
      const randomX = (Math.random() - 0.5) * 60;
      const randomY = (Math.random() - 0.5) * 60;

      let newX = dodgePos.x + (deltaX / distance) * pushFactor + randomX;
      let newY = dodgePos.y + (deltaY / distance) * pushFactor + randomY;

      // Strict bounding box so it stays within the image area
      // Base position is bottom-left. Max right = 350px, Max up = -400px
      newX = Math.max(-20, Math.min(newX, 380));
      newY = Math.max(-420, Math.min(newY, 40));

      setDodgePos({ x: newX, y: newY });
    }
  };

  const resetDodge = () => {
    setDodgePos({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full min-h-[70vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gray-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gray-200 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Content Area */}
        <div className="flex flex-col space-y-8 animate-fade-in text-center lg:text-left">
          <div className="space-y-4">
            <p className="text-gray-400 text-xs sm:text-sm tracking-[0.5em] uppercase font-light">
              Premium Collection 2026
            </p>
            <h1 className="text-4xl sm:text-7xl md:text-8xl prata-regular text-gray-900 leading-[1.1] transform transition-transform duration-700">
              Redefine Your <br className="block" /> <span className="italic">Style</span>
            </h1>
            <p className="text-gray-500 text-base sm:text-xl font-light max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Experience the pinnacle of luxury fashion where minimal design meets maximum impact. 
              Curated for the modern aesthetic.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center pt-4">
            <button 
              onClick={() => navigate('/collection')}
              className="px-10 py-4 bg-gray-900 text-white text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-black transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-1 w-full sm:w-auto"
            >
              Explore Collection
            </button>
            <button 
              onClick={() => navigate('/about')}
              className="px-10 py-4 border border-gray-200 text-gray-900 text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-gray-50 transition-all duration-500 w-full sm:w-auto"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Right Visual Area */}
        <div 
          className="relative group hidden lg:block"
          onMouseMove={handleDodge}
          onMouseLeave={resetDodge}
        >
          {/* Decorative light glow frame */}
          <div className="absolute -inset-4 rounded-2xl -z-10 transition-all duration-700 group-hover:scale-105 group-hover:bg-white/50 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.9)] blur-md"></div>
          
          <div className="relative overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/40 transition-all duration-700 group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] group-hover:-translate-y-2 group-hover:border-white z-10">
            <img 
              src={hero_luxury} 
              alt="Luxury Fashion" 
              className="w-full h-auto object-cover transform transition-transform duration-[2000ms] group-hover:scale-110 group-hover:brightness-105"
            />
            {/* Light Glass/Shine Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-overlay"></div>
            {/* Moving light sweep effect */}
            <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:translate-x-[150%] transition-transform duration-[1200ms] ease-in-out skew-x-12"></div>
          </div>

          {/* Floating Detail Card with Glassmorphism */}
          <div 
            ref={cardRef}
            style={{ 
              transform: `translate(${dodgePos.x}px, ${dodgePos.y}px)`, 
              transition: dodgePos.x !== 0 || dodgePos.y !== 0 ? 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'transform 1s ease-out'
            }}
            className={`absolute -bottom-6 -left-6 backdrop-blur-xl bg-white/70 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.08)] rounded-2xl border border-white/70 pointer-events-none ${dodgePos.x === 0 && dodgePos.y === 0 ? 'animate-bounce-subtle group-hover:-translate-y-3 group-hover:scale-105 transition-all duration-700 z-20' : 'z-50'}`}
          >
            <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-1 pointer-events-none">Material</p>
            <p className="text-sm font-bold text-gray-900 drop-shadow-sm pointer-events-none">100% Organic Silk</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Hero;
