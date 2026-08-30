import React, { useEffect, useRef, useState } from 'react';

const CursorGlow = ({ active }) => {
    const cursorRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const onMouseMove = (e) => {
            if (cursorRef.current && active) {
                if (!isVisible) setIsVisible(true);
                // Center the 300x300 glow orb perfectly on the cursor
                cursorRef.current.style.transform = `translate3d(${e.clientX - 150}px, ${e.clientY - 150}px, 0)`;
            }
        };

        if (active) {
            window.addEventListener('mousemove', onMouseMove, { passive: true });
        } else {
            setIsVisible(false);
        }

        return () => window.removeEventListener('mousemove', onMouseMove);
    }, [active, isVisible]);

    return (
        <div 
            ref={cursorRef}
            className={`pointer-events-none fixed top-0 left-0 w-[300px] h-[300px] bg-yellow-500/15 rounded-full blur-[80px] z-[9999] transition-opacity duration-700 ease-in-out mix-blend-screen ${active && isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ willChange: 'transform, opacity' }}
        />
    );
};

export default CursorGlow;
