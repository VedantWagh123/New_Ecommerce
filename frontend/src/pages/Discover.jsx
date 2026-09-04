import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import DiscoverVideoPlayer from '../components/DiscoverVideoPlayer';

const Discover = () => {
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const { backendUrl } = useContext(ShopContext);

    const observerRef = useRef(null);
    const containerRef = useRef(null);

    // Fetch Videos (Pagination)
    const fetchVideos = async (pageNumber) => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const res = await axios.get(`${backendUrl}/api/discover/feed?page=${pageNumber}&limit=5`);
            if (res.data.success) {
                if (res.data.videos.length === 0) {
                    setHasMore(false);
                } else {
                    setVideos(prev => [...prev, ...res.data.videos]);
                }
            }
        } catch (error) {
            console.error("Error fetching discover videos", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchVideos(1);
    }, []);

    // Intersection Observer for active video detection
    useEffect(() => {
        const options = {
            root: containerRef.current,
            rootMargin: '0px',
            threshold: 0.6 // Video is considered active if 60% visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Number(entry.target.dataset.index);
                    setActiveVideoIndex(index);
                    
                    // Trigger load more if we are near the end
                    if (index >= videos.length - 2 && hasMore && !loading) {
                        setPage(prev => {
                            const newPage = prev + 1;
                            fetchVideos(newPage);
                            return newPage;
                        });
                    }
                }
            });
        }, options);

        // Disconnect old observer and observe current children
        if (observerRef.current) {
            observerRef.current.disconnect();
        }
        
        if (containerRef.current) {
            const elements = containerRef.current.querySelectorAll('.video-container-snap');
            elements.forEach(el => observer.observe(el));
        }

        observerRef.current = observer;

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [videos, hasMore, loading]);

    if (videos.length === 0 && !loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-6xl mb-4">🎥</div>
                <h2 className="text-2xl font-black text-gray-800">Studio is empty</h2>
                <p className="text-gray-500 mt-2">No videos have been uploaded yet.</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 top-[70px] flex justify-center z-40 overflow-hidden bg-gray-50">
            
            {/* --- ADVANCED ANIMATED BACKGROUND --- */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Flowing Gradient Background */}
                <div className="absolute inset-[-50%] bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-purple-50 to-pink-50 opacity-80 animate-[spin_40s_linear_infinite]"></div>
                
                {/* Floating Light Orbs */}
                <div className="absolute top-[10%] left-[20%] w-[30rem] h-[30rem] bg-purple-300/40 rounded-full blur-[100px] mix-blend-multiply animate-[float_8s_ease-in-out_infinite]"></div>
                <div className="absolute bottom-[10%] right-[15%] w-[35rem] h-[35rem] bg-indigo-300/30 rounded-full blur-[120px] mix-blend-multiply animate-[float_12s_ease-in-out_infinite_reverse]"></div>
                <div className="absolute top-[40%] left-[60%] w-[20rem] h-[20rem] bg-pink-300/40 rounded-full blur-[90px] mix-blend-multiply animate-[float_10s_ease-in-out_infinite_2s]"></div>
                <div className="absolute top-[20%] right-[30%] w-[15rem] h-[15rem] bg-yellow-200/40 rounded-full blur-[80px] mix-blend-multiply animate-[float_14s_ease-in-out_infinite_1s]"></div>
                
                {/* Animated Sparkles */}
                <svg className="absolute top-[15%] left-[25%] w-8 h-8 animate-[sparkle-twinkle_3s_infinite]" viewBox="0 0 32 32" fill="none"><path d="M16 0L18.5 13.5L32 16L18.5 18.5L16 32L13.5 18.5L0 16L13.5 13.5L16 0Z" fill="#FDE047"/></svg>
                <svg className="absolute bottom-[25%] left-[15%] w-6 h-6 animate-[sparkle-twinkle_4s_infinite_1s]" viewBox="0 0 32 32" fill="none"><path d="M16 0L18.5 13.5L32 16L18.5 18.5L16 32L13.5 18.5L0 16L13.5 13.5L16 0Z" fill="#A78BFA"/></svg>
                <svg className="absolute top-[30%] right-[15%] w-10 h-10 animate-[sparkle-twinkle_3.5s_infinite_0.5s]" viewBox="0 0 32 32" fill="none"><path d="M16 0L18.5 13.5L32 16L18.5 18.5L16 32L13.5 18.5L0 16L13.5 13.5L16 0Z" fill="#FDE047"/></svg>
                
                {/* Curved Dashed Arrows */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none">
                    {/* Left Arrow (Trending Now -> Phone) */}
                    <path className="curved-line" d="M 32% 65% C 38% 75%, 44% 75%, 46% 68%" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 44.5% 69.5% L 46% 68% L 45% 66.5%" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Right Arrow (Shop The Look -> Phone) */}
                    <path className="curved-line" d="M 68% 35% C 62% 45%, 58% 48%, 54% 45%" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 55% 44% L 54% 45% L 55.5% 46%" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {/* Animated Noise Texture Overlay for Premium Feel */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
            </div>

            {/* --- DESKTOP LEFT SIDE DECORATION --- */}
            <div className="hidden sm:flex absolute left-0 top-0 bottom-0 w-[calc(50%-220px)] flex-col items-end justify-center pr-16 pointer-events-none z-10">
                <div className="relative text-right group">
                    <h1 className="text-6xl lg:text-[5.5rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 tracking-tighter drop-shadow-sm leading-none">
                        Forever
                        <br />
                        <span className="italic font-serif text-5xl lg:text-[4.5rem] font-light bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
                            Studio
                        </span>
                    </h1>
                    <p className="mt-4 text-gray-500 font-medium tracking-widest uppercase text-xs opacity-70">
                        The Future of Commerce
                    </p>
                    
                    <div className="mt-10 flex items-center gap-4 bg-white/90 backdrop-blur-xl p-4 pr-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white relative z-10 w-max ml-auto animate-[float-slow_6s_ease-in-out_infinite] cursor-pointer hover:scale-105 transition-transform duration-300">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/30">✨</div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-gray-900">Trending Now</p>
                            <p className="text-xs text-gray-500 font-medium">Discover what's viral</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DESKTOP RIGHT SIDE DECORATION --- */}
            <div className="hidden sm:flex absolute right-0 top-0 bottom-0 w-[calc(50%-220px)] flex-col items-start justify-center pl-16 pointer-events-none z-10">
                <div className="space-y-8 relative">
                    <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-[0_12px_40px_rgb(0,0,0,0.06)] w-72 animate-[float-medium_7s_ease-in-out_infinite] hover:scale-105 transition-transform duration-300 group cursor-pointer relative z-10">
                        <div className="absolute -top-3 -left-3 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg text-white font-bold animate-pulse z-20">🛍️</div>
                        <h3 className="font-black text-gray-900 text-lg uppercase tracking-wider mb-2 ml-4">Shop The Look</h3>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">
                            See something you like? Tap the <span className="font-bold text-black border-b-2 border-indigo-500 group-hover:text-indigo-600 transition-colors">Add to Cart</span> button directly on the video.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-400 via-purple-400 to-fuchsia-400 p-6 rounded-3xl shadow-[0_20px_40px_-10px_rgba(167,139,250,0.5)] w-72 animate-[float-fast_8s_ease-in-out_infinite_1s] hover:scale-105 transition-transform duration-300 overflow-hidden relative border border-white/40 cursor-pointer">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                        <h3 className="font-black text-white text-lg uppercase tracking-wider mb-2 flex items-center gap-2 relative z-10">
                            <span className="animate-bounce text-xl">🔥</span> Swipe Up
                        </h3>
                        <p className="text-sm text-white/90 font-medium leading-relaxed relative z-10">
                            Scroll vertically to discover endless fashion inspiration tailored for you.
                        </p>
                        {/* Up arrows indicator */}
                        <div className="absolute bottom-4 right-6 flex flex-col items-center opacity-80 animate-pulse">
                            <svg className="w-6 h-6 text-white -mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Custom CSS Animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0) scale(1); }
                    33% { transform: translateY(-30px) translateX(20px) scale(1.05); }
                    66% { transform: translateY(20px) translateX(-20px) scale(0.95); }
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-20px) scale(1.02); }
                }
                @keyframes float-medium {
                    0%, 100% { transform: translateY(0) rotate(2deg); }
                    50% { transform: translateY(-15px) rotate(-1deg); }
                }
                @keyframes float-fast {
                    0%, 100% { transform: translateY(0) rotate(-3deg); }
                    50% { transform: translateY(-10px) rotate(1deg); }
                }
                @keyframes dash-flow {
                    from { stroke-dashoffset: 20; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes sparkle-twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); }
                    50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
                }
                .curved-line {
                    stroke-dasharray: 6 4;
                    animation: dash-flow 1s linear infinite;
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 4s ease infinite;
                }
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
            `}</style>

            {/* 
              Mobile: Full screen snap scrolling
              Desktop: Centered iPhone-sized container with snap scrolling
            */}
            <div className="relative w-full h-full sm:w-[400px] sm:max-h-[85vh] sm:mt-8 z-20 flex flex-col items-center">
                {/* Glowing Platform Under Phone */}
                <div className="hidden sm:block absolute -bottom-10 w-[120%] h-12 bg-indigo-300 rounded-[100%] blur-xl opacity-70 animate-pulse pointer-events-none"></div>
                <div className="hidden sm:block absolute -bottom-10 w-[80%] h-4 bg-white rounded-[100%] blur-md opacity-80 pointer-events-none"></div>

                <div 
                    ref={containerRef}
                    className="w-full h-full rounded-none sm:rounded-[40px] overflow-y-scroll snap-y snap-mandatory scrollbar-hide shadow-[0_30px_60px_-15px_rgba(79,70,229,0.4)] bg-black relative border-[6px] border-gray-900 box-content ring-2 ring-white/30"
                >
                {videos.map((video, index) => (
                    <div 
                        key={`${video._id}-${index}`} 
                        data-index={index}
                        className="video-container-snap w-full h-full snap-start relative bg-black shrink-0 overflow-hidden"
                        style={{ borderRadius: 'inherit' }}
                    >
                        <DiscoverVideoPlayer 
                            video={video} 
                            isActive={activeVideoIndex === index}
                        />
                    </div>
                ))}
                
                {loading && (
                    <div className="w-full h-20 flex items-center justify-center bg-black" style={{ borderRadius: 'inherit' }}>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default Discover;
