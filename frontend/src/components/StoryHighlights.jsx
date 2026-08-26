import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const StoryHighlights = () => {
    const { backendUrl } = useContext(ShopContext);
    const [stories, setStories] = useState([]);
    const [activeStoryIndex, setActiveStoryIndex] = useState(null);
    const [progress, setProgress] = useState(0);
    const navigate = useNavigate();

    // Fetch stories from backend
    useEffect(() => {
        const fetchStories = async () => {
            try {
                const response = await axios.get(backendUrl + '/api/story/list');
                if (response.data.success && response.data.stories.length > 0) {
                    setStories(response.data.stories);
                }
            } catch (error) {
                console.error("Failed to fetch stories", error);
            }
        };
        fetchStories();
    }, [backendUrl]);

    // Handle Story Timer Progress
    useEffect(() => {
        let timer;
        if (activeStoryIndex !== null) {
            setProgress(0); // Reset progress on new story
            timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        // Move to next story when progress reaches 100%
                        clearInterval(timer);
                        if (activeStoryIndex < stories.length - 1) {
                            setActiveStoryIndex(activeStoryIndex + 1);
                        } else {
                            setActiveStoryIndex(null); // Close if it's the last story
                        }
                        return 0;
                    }
                    return prev + 1; // 1% every 50ms = 5 seconds total per story
                });
            }, 50);
        }
        return () => clearInterval(timer);
    }, [activeStoryIndex, stories.length]);

    const handleStoryClick = (index) => {
        setActiveStoryIndex(index);
    };

    const closeStory = () => {
        setActiveStoryIndex(null);
    };

    const nextStory = (e) => {
        e.stopPropagation();
        if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
        } else {
            closeStory();
        }
    };

    const prevStory = (e) => {
        e.stopPropagation();
        if (activeStoryIndex > 0) {
            setActiveStoryIndex(activeStoryIndex - 1);
        }
    };

    const handleActionClick = (link, e) => {
        e.stopPropagation();
        closeStory();
        navigate(link || '/collection');
    };

    if (stories.length === 0) return null;

    return (
        <div className="w-full bg-white pt-5 pb-3 border-b border-gray-100 overflow-x-auto scrollbar-hide px-4 sm:px-8">
            <div className="flex items-center gap-5 sm:gap-8 min-w-max mx-auto max-w-7xl">
                {stories.map((story, index) => (
                    <div 
                        key={story._id} 
                        onClick={() => handleStoryClick(index)}
                        className="flex flex-col items-center gap-2.5 cursor-pointer group"
                    >
                        <div className="w-24 h-24 sm:w-[110px] sm:h-[110px] rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-orange-500 to-pink-500 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                            <div className="w-full h-full rounded-full border-[2.5px] border-white overflow-hidden bg-gray-100">
                                <img 
                                    src={story.image} 
                                    alt={story.title} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <span className="text-[11px] sm:text-[13px] font-semibold text-gray-800 max-w-[80px] sm:max-w-[95px] truncate text-center">
                            {story.title}
                        </span>
                    </div>
                ))}
            </div>

            {/* Full Screen Story Modal */}
            {activeStoryIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in backdrop-blur-md">
                    <div className="relative w-full h-full sm:w-[400px] sm:h-[90vh] sm:rounded-3xl overflow-hidden bg-gray-900 shadow-2xl flex flex-col">
                        
                        {/* Progress Bar Container */}
                        <div className="absolute top-4 left-4 right-4 flex gap-1 z-50">
                            {stories.map((_, idx) => (
                                <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                                        style={{ 
                                            width: idx === activeStoryIndex ? `${progress}%` : (idx < activeStoryIndex ? '100%' : '0%') 
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Top Header */}
                        <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-50">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/50">
                                    <img src={stories[activeStoryIndex].image} className="w-full h-full object-cover" alt="" />
                                </div>
                                <span className="text-white text-xs font-bold drop-shadow-md">
                                    {stories[activeStoryIndex].title}
                                </span>
                            </div>
                            <button onClick={closeStory} className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Story Image */}
                        <img 
                            src={stories[activeStoryIndex].image} 
                            alt="Story content" 
                            className="w-full h-full object-cover absolute inset-0 z-0"
                        />
                        
                        {/* Dark Gradient Overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10 pointer-events-none" />

                        {/* Navigation Click Areas */}
                        <div className="absolute inset-0 z-20 flex">
                            <div className="w-1/3 h-full cursor-pointer" onClick={prevStory} />
                            <div className="w-2/3 h-full cursor-pointer" onClick={nextStory} />
                        </div>

                        {/* Bottom Action Area */}
                        <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center px-6">
                            <button 
                                onClick={(e) => handleActionClick(stories[activeStoryIndex].link, e)}
                                className="w-full max-w-[250px] bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-bold text-sm py-3.5 rounded-full flex items-center justify-center gap-2 transition-all group shadow-xl uppercase tracking-widest cursor-pointer"
                            >
                                Shop Now 
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        
                        {/* Desktop Side Nav Arrows */}
                        <button 
                            onClick={prevStory}
                            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-50 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={nextStory}
                            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-50 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryHighlights;
