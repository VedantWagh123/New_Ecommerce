import React, { useEffect, useRef, useState } from 'react';

const CursorGlow = ({ active }) => {
    const cursorRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    
    // Position refs for lerping
    const targetPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const currentPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const requestRef = useRef();

    useEffect(() => {
        if (!active) {
            setIsVisible(false);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            return;
        }

        const onMouseMove = (e) => {
            targetPos.current.x = e.clientX;
            targetPos.current.y = e.clientY;
            if (!isVisible) setIsVisible(true);
        };

        const updateCursor = () => {
            // Lerp factor (lower is slower/smoother)
            const ease = 0.04;
            
            currentPos.current.x += (targetPos.current.x - currentPos.current.x) * ease;
            currentPos.current.y += (targetPos.current.y - currentPos.current.y) * ease;
            
            if (cursorRef.current) {
                // Subtract 150 to center the 300x300 orb
                cursorRef.current.style.transform = `translate3d(${currentPos.current.x - 150}px, ${currentPos.current.y - 150}px, 0)`;
            }
            
            requestRef.current = requestAnimationFrame(updateCursor);
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        requestRef.current = requestAnimationFrame(updateCursor);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [active, isVisible]);

    return (
        <div 
            ref={cursorRef}
            className={`pointer-events-none fixed top-0 left-0 w-[300px] h-[300px] bg-yellow-500/20 rounded-full blur-[100px] z-[9999] transition-opacity duration-1000 ease-in-out mix-blend-screen ${active && isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ willChange: 'transform, opacity' }}
        />
    );
};

export default CursorGlow;
