import React, { useRef, useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';

const DiscoverVideoPlayer = ({ video, isActive, onVideoEnd }) => {
    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasLiked, setHasLiked] = useState(false);
    const { currency, addToCart, navigate, backendUrl } = useContext(ShopContext);

    // Play/Pause logic based on visibility (isActive)
    useEffect(() => {
        if (!videoRef.current) return;

        if (isActive) {
            videoRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(e => {
                // Auto-play was prevented
                console.log("Auto-play prevented", e);
                setIsPlaying(false);
            });
            
            // Register view
            axios.post(`${backendUrl}/api/discover/metrics`, { id: video._id, metric: 'views' }).catch(e => console.error(e));
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive, video._id, backendUrl]);

    const togglePlay = () => {
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
    };

    const handleLike = (e) => {
        e.stopPropagation();
        if (!hasLiked) {
            setHasLiked(true);
            axios.post(`${backendUrl}/api/discover/metrics`, { id: video._id, metric: 'likes' }).catch(e => console.error(e));
        } else {
            setHasLiked(false);
        }
    };

    const handleProductClick = (e) => {
        e.stopPropagation();
        axios.post(`${backendUrl}/api/discover/metrics`, { id: video._id, metric: 'clicks' }).catch(e => console.error(e));
        navigate(`/product/${video.productId._id}`);
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        axios.post(`${backendUrl}/api/discover/metrics`, { id: video._id, metric: 'clicks' }).catch(e => console.error(e));
        // Use the first available size if any, otherwise just add
        const size = video.productId.sizes && video.productId.sizes.length > 0 ? video.productId.sizes[0] : '';
        addToCart(video.productId._id, size);
    };

    return (
        <div className="relative w-full h-full bg-black snap-start flex justify-center overflow-hidden">
            <video
                ref={videoRef}
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                loop
                muted={isMuted}
                playsInline
                onClick={togglePlay}
                className="h-full w-full object-cover sm:w-auto sm:max-w-md sm:aspect-[9/16]"
            />
            
            {/* Play/Pause Overlay Indicator */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                        <svg className="w-8 h-8 translate-x-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                </div>
            )}

            {/* Top Bar (Mute) */}
            <div className="absolute top-4 right-4 z-10 flex gap-3">
                <button 
                    onClick={toggleMute}
                    className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition"
                >
                    {isMuted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    )}
                </button>
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-32 z-10 flex flex-col items-center gap-6 text-white drop-shadow-md">
                <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={handleLike}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md ${hasLiked ? 'text-rose-500' : 'text-white'}`}>
                        <svg className="w-6 h-6" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </div>
                    <span className="text-xs font-semibold">{video.metrics.likes + (hasLiked ? 1 : 0)}</span>
                </div>
                
                <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/product/${video.productId._id}`);
                    alert("Product Link Copied!");
                }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </div>
                    <span className="text-xs font-semibold">Share</span>
                </div>
            </div>

            {/* Bottom Info & Product Card */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 sm:pb-6 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
                <div className="pointer-events-auto">
                    <h2 className="text-white font-bold text-lg leading-tight mb-1">{video.title}</h2>
                    <p className="text-gray-300 text-sm line-clamp-2 mb-4">{video.description}</p>
                    
                    {/* Mini Product Card */}
                    <div 
                        className="bg-white/95 backdrop-blur-md rounded-xl p-2.5 flex items-center gap-3 cursor-pointer hover:bg-white transition-colors"
                        onClick={handleProductClick}
                    >
                        <img src={video.productId.image[0]} alt={video.productId.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{video.productId.storeName || 'Forever Official'}</p>
                            <h3 className="text-sm font-black text-gray-900 line-clamp-1">{video.productId.name}</h3>
                            <p className="text-sm font-black text-emerald-600">{currency}{video.productId.price}</p>
                        </div>
                        <button 
                            onClick={handleAddToCart}
                            className="bg-black hover:bg-gray-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscoverVideoPlayer;
