import React, { useState, useRef, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';

const AIFashionAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recentProductsContext, setRecentProductsContext] = useState([]);
  
  // Draggable Modal State
  const [position, setPosition] = useState(null); // { x, y }
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Consume live products, token, cart logic & wishlist from ShopContext
  const { products, currency, addToCart, backendUrl, token, toggleWishlist, isInWishlist, getUserCart, addToCompare } = useContext(ShopContext);

  // Initial welcome message
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! 👋 I'm your Real-Time AI Fashion Stylist & Assistant. Ask me to search our catalog, check order status, compare products, or build an outfit under your budget!",
      suggestedPrompts: [
        "Show me black t-shirts",
        "College outfit under ₹3000",
        "Party outfit under ₹2500"
      ],
      recommendations: [],
      isOutfit: false
    }
  ]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Handle Drag Events for Chatbot Window
  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    if (!dragRef.current) return;

    const rect = dragRef.current.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.left,
      initialY: rect.top
    };
    setIsDragging(true);
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    if (!dragRef.current || !e.touches[0]) return;

    const touch = e.touches[0];
    const rect = dragRef.current.getBoundingClientRect();
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: rect.left,
      initialY: rect.top
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const modalWidth = dragRef.current ? dragRef.current.offsetWidth : 430;
      const modalHeight = dragRef.current ? dragRef.current.offsetHeight : 620;

      const newX = Math.max(10, Math.min(windowWidth - modalWidth - 10, dragStartRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(windowHeight - modalHeight - 10, dragStartRef.current.initialY + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e) => {
      if (!isDragging || !e.touches[0]) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.startX;
      const dy = touch.clientY - dragStartRef.current.startY;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const modalWidth = dragRef.current ? dragRef.current.offsetWidth : 320;
      const modalHeight = dragRef.current ? dragRef.current.offsetHeight : 500;

      const newX = Math.max(5, Math.min(windowWidth - modalWidth - 5, dragStartRef.current.initialX + dx));
      const newY = Math.max(5, Math.min(windowHeight - modalHeight - 5, dragStartRef.current.initialY + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Call Ollama backend AI Chat API (`/api/ai/chat`)
  const queryOllamaBackend = async (userText, history) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`${backendUrl}/api/ai/chat`, {
        prompt: userText,
        // Only send the last 6 messages to prevent local LLM context overflow & speed up response times
        conversationHistory: history.slice(-6),
        recentProducts: recentProductsContext
      }, { headers });

      if (response.data && response.data.success) {
        const recommended = response.data.recommendedProducts || [];
        setRecentProductsContext(recommended);

        // If backend executed a real cart action, refresh user cart context and sync local state!
        if (response.data.action === 'ADD_TO_CART_SUCCESS') {
          const itemsToSync = response.data.recommendedProducts || recentProductsContext;
          if (itemsToSync && itemsToSync.length > 0) {
            itemsToSync.forEach(item => {
              if (item && item._id) {
                const size = (item.sizes && item.sizes.length > 0) ? item.sizes[0] : 'M';
                addToCart(item._id, size);
              }
            });
          }
          if (token) {
            getUserCart(token);
          }
          toast.success("✅ Complete outfit added to cart");
        }

        return {
          responseText: response.data.reply || `Here are matching products from our store:`,
          recommendedItems: recommended,
          isOutfitResult: Boolean(response.data.isOutfit),
          isAiGeneratedConcept: Boolean(response.data.isAiGeneratedConcept),
          conceptData: response.data.conceptData || null,
          comparisonList: response.data.comparisonList || null,
          suggestedPrompts: response.data.suggestedPrompts || []
        };
      }
    } catch (err) {
      console.warn("Backend AI call notice:", err.message);
    }

    // Grounded behavior: DO NOT fabricate mock products on backend disconnect!
    return {
      responseText: "I'm unable to check the store catalogue right now. Please try again in a moment.",
      recommendedItems: [],
      isOutfitResult: false,
      isAiGeneratedConcept: false,
      conceptData: null,
      comparisonList: null
    };
  };

  // Typewriter streaming effect
  const streamMessageText = (msgId, fullText, delayMs = 12) => {
    let currentLength = 0;
    const interval = setInterval(() => {
      currentLength += 3;
      const partialText = fullText.slice(0, currentLength);

      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, text: partialText } : m))
      );

      if (currentLength >= fullText.length) {
        clearInterval(interval);
        setMessages(prev =>
          prev.map(m => (m.id === msgId ? { ...m, text: fullText } : m))
        );
      }
    }, delayMs);
  };

  // Main Handle Send Message
  const handleSendPrompt = async (promptText) => {
    if (!promptText || !promptText.trim()) return;

    const userText = promptText.trim();
    setInputQuery('');

    // Append User Message
    const userMsgId = Date.now();
    const currentMessages = [...messages, { id: userMsgId, sender: 'user', text: userText }];
    setMessages(currentMessages);
    setIsTyping(true);

    const result = await queryOllamaBackend(userText, currentMessages);
    setIsTyping(false);

    const aiMsgId = Date.now() + 1;
    setMessages(prev => [
      ...prev,
      {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        recommendations: result.recommendedItems,
        isOutfit: result.isOutfitResult,
        isAiGeneratedConcept: result.isAiGeneratedConcept,
        conceptData: result.conceptData,
        comparisonList: result.comparisonList,
        suggestedPrompts: result.suggestedPrompts
      }
    ]);

    // Stream text real-time
    streamMessageText(aiMsgId, result.responseText);
  };

  // Add Item to Cart Directly
  const handleDirectAddToCart = (item) => {
    if (!item || !item._id) return;
    const size = (item.sizes && item.sizes.length > 0) ? item.sizes[0] : 'M';
    addToCart(item._id, size);
    toast.success(`🛒 Added ${item.name} (Size: ${size}) to Cart!`);
  };

  // Add Complete Outfit to Cart
  const handleAddOutfitToCart = (outfitItems) => {
    if (!outfitItems || outfitItems.length === 0) return;
    let addedCount = 0;
    outfitItems.forEach(item => {
      if (item && item._id) {
        const availableSize = (item.sizes && item.sizes.length > 0) ? item.sizes[0] : 'M';
        addToCart(item._id, availableSize);
        addedCount++;
      }
    });
    if (token) {
      getUserCart(token);
    }
    toast.success("✅ Complete outfit added to cart");
  };

  return (
    <>
      {/* Floating Chatbot Light Button with Bouncing Ball Animation (Bottom Right) */}
      <div className="fixed bottom-5 right-5 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Fashion Assistant"
            className="animate-bounce flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl border border-gray-200 transition-all duration-300 active:scale-90 group cursor-pointer"
          >
            {/* Robot Face SVG Icon */}
            <svg
              className="w-6 h-6 text-gray-800 group-hover:scale-110 transition-transform duration-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v3M9 3h6" />
              <rect x="4" y="6" width="16" height="12" rx="4" />
              <circle cx="9" cy="11" r="1.25" fill="currentColor" />
              <circle cx="15" cy="11" r="1.25" fill="currentColor" />
              <path d="M9.5 15c.83.67 2.17.67 3 0" />
              <path d="M2 12h2M20 12h2" />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-2xs z-40 sm:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Light Theme Chat Panel (Fully Responsive & Draggable) */}
      {isOpen && (
        <div
          ref={dragRef}
          style={
            position
              ? {
                  position: 'fixed',
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  bottom: 'auto',
                  right: 'auto',
                  margin: 0
                }
              : undefined
          }
          className={`fixed ${
            position ? '' : 'inset-x-2 bottom-2 top-14 sm:top-auto sm:bottom-20 sm:right-6 sm:left-auto'
          } w-auto max-w-[calc(100vw-16px)] sm:w-[440px] h-auto sm:h-[630px] max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50 animate-ai-slide-up resize min-w-[300px] min-h-[400px] ${
            isDragging ? 'shadow-inner opacity-95 scale-[0.99] transition-none' : ''
          }`}
        >
          {/* Light Header (Drag Handle) */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            title="Click & Drag to move chatbot anywhere on screen"
            className="bg-white text-gray-900 p-3 sm:p-4 flex items-center justify-between border-b border-gray-200 shadow-2xs cursor-grab active:cursor-grabbing select-none shrink-0"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              {/* Drag Grip Indicator */}
              <div className="flex flex-col gap-0.5 text-gray-300 hover:text-gray-500 transition-colors pr-0.5 shrink-0 cursor-grab">
                <div className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                </div>
                <div className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                </div>
                <div className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                </div>
              </div>

              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 border border-gray-200 shrink-0">
                <svg
                  className="w-4 h-4 text-gray-800"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v3M9 3h6" />
                  <rect x="4" y="6" width="16" height="12" rx="4" />
                  <circle cx="9" cy="11" r="1.25" fill="currentColor" />
                  <circle cx="15" cy="11" r="1.25" fill="currentColor" />
                  <path d="M9.5 15c.83.67 2.17.67 3 0" />
                  <path d="M2 12h2M20 12h2" />
                </svg>
              </div>

              <div className="min-w-0 truncate">
                <h3 className="font-semibold text-xs sm:text-sm text-gray-900 tracking-wide flex items-center gap-1.5 truncate">
                  AI Fashion Stylist
                  {position && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPosition(null);
                      }}
                      title="Reset to default position"
                      className="text-[10px] text-gray-400 hover:text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded transition-colors shrink-0"
                    >
                      Reset
                    </button>
                  )}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-light flex items-center gap-1.5 mt-0.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="truncate">Live MongoDB Catalog Grounded</span>
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer shrink-0 ml-1"
              aria-label="Close Assistant"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Stream (Overflow Container) */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto overflow-x-hidden space-y-3 bg-gray-50/70 text-xs sm:text-sm max-w-full">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2.5 max-w-full overflow-hidden">
                {/* Chat Bubble */}
                <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} max-w-full`}>
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] p-3 rounded-2xl shadow-2xs break-words overflow-hidden ${
                      msg.sender === 'user'
                        ? 'bg-gray-900 text-white rounded-br-xs'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-xs'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="flex items-center gap-1 mb-1 text-[11px] font-medium text-gray-500">
                        <span>AI Fashion Stylist</span>
                      </div>
                    )}
                    <p className="leading-relaxed text-xs sm:text-sm whitespace-pre-line break-words">{msg.text}</p>

                    {/* Suggested Prompts */}
                    {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                          Suggested Ideas:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedPrompts.map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendPrompt(prompt)}
                              className="text-xs bg-white hover:bg-gray-100 text-gray-700 hover:text-black border border-gray-200 rounded-full px-2.5 py-1 transition-all duration-200 text-left font-normal shadow-2xs active:scale-95 cursor-pointer max-w-full truncate"
                            >
                              "{prompt}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* EXPLICIT AI IMAGE GENERATION CONCEPT CARD */}
                {msg.isAiGeneratedConcept && msg.conceptData && (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 shadow-xs space-y-2.5 max-w-full overflow-hidden">
                    <div className="flex items-center justify-between gap-1 flex-wrap border-b border-amber-200/60 pb-1.5">
                      <span className="text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                        ✨ AI Visual Concept
                      </span>
                      <span className="text-[10px] text-amber-800 font-semibold">
                        Not Store Inventory
                      </span>
                    </div>

                    {/* Full Aspect Ratio AI Image Container */}
                    <div className="relative w-full aspect-square max-h-64 bg-amber-100 rounded-xl overflow-hidden border border-amber-200 shadow-2xs group">
                      <img
                        src={msg.conceptData.imageUrl}
                        alt={msg.conceptData.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = msg.conceptData.fallbackUrl || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80";
                        }}
                        className="w-full h-full object-cover rounded-xl group-hover:scale-102 transition-transform duration-500"
                      />
                    </div>

                    {/* Concept Title & Fashion Breakdown */}
                    <div className="space-y-1 pt-0.5">
                      <h4 className="text-xs font-bold text-amber-950 break-words">
                        {msg.conceptData.title}
                      </h4>
                      {msg.conceptData.fashionStyle && (
                        <div className="text-[11px] text-amber-900 space-y-1 pt-1.5 border-t border-amber-200/60 font-medium">
                          <p><span className="font-semibold text-amber-950">👗 Style:</span> {msg.conceptData.fashionStyle}</p>
                          <p><span className="font-semibold text-amber-950">🧵 Fabric:</span> {msg.conceptData.fabric}</p>
                          <p><span className="font-semibold text-amber-950">💡 Styling Advice:</span> {msg.conceptData.stylingAdvice}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* REAL STORE PRODUCT RECOMMENDATION CARDS (Fully Responsive Layout) */}
                {msg.recommendations && msg.recommendations.length > 0 && !msg.isAiGeneratedConcept && (
                  <div className="space-y-2 max-w-full overflow-hidden">
                    <div className="flex items-center justify-between px-0.5 flex-wrap gap-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        {msg.isOutfit ? '👔 Head-to-Toe AI Personal Stylist Outfit:' : 'Matching Store Products:'}
                      </p>
                      {msg.isOutfit && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                          Total ({msg.recommendations.length} items): ₹{msg.recommendations.reduce((sum, item) => sum + (item.price || 0), 0)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 max-w-full">
                      {msg.recommendations.map((item, idx) => {
                        const outfitTypeBadges = ['👕 Topwear / Shirt', '👖 Bottomwear / Pants', '👟 Footwear / Shoes', '⌚ Accessories / Jewellery'];
                        const outfitBadge = msg.isOutfit && outfitTypeBadges[idx] ? outfitTypeBadges[idx] : null;

                        return (
                          <div
                            key={item._id || idx}
                            className="bg-white border border-gray-200/80 rounded-2xl p-2.5 sm:p-3 flex flex-col gap-2.5 shadow-2xs hover:shadow-md hover:border-gray-300 transition-all duration-300 group max-w-full overflow-hidden"
                          >
                            {/* Full Product Image Container */}
                            <div className="w-full h-44 sm:h-52 bg-gray-50 rounded-xl overflow-hidden relative border border-gray-100/80 group cursor-pointer">
                              <img
                                src={Array.isArray(item.image) ? item.image[0] : (item.image || assets.hero_img)}
                                alt={item.name}
                                className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                                onClick={() => {
                                  setIsOpen(false);
                                  navigate(`/product/${item._id}`);
                                }}
                              />

                              {/* Top-Left Category / Outfit Badge */}
                              <div className="absolute top-2 left-2 flex items-center gap-1">
                                {outfitBadge ? (
                                  <span className="text-[10px] bg-amber-900/90 text-amber-50 backdrop-blur-md px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-xs">
                                    {outfitBadge}
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-gray-900/80 text-white backdrop-blur-md px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-xs truncate max-w-[120px]">
                                    {item.subCategory || item.category || 'Apparel'}
                                  </span>
                                )}
                              </div>

                              {/* Top-Right Wishlist Button */}
                              {toggleWishlist && item._id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWishlist(item._id);
                                  }}
                                  title="Wishlist"
                                  className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md border text-xs transition-all shadow-xs active:scale-90 cursor-pointer ${
                                    isInWishlist && isInWishlist(item._id)
                                      ? 'bg-rose-500/90 text-white border-rose-400'
                                      : 'bg-white/80 text-gray-700 border-gray-200 hover:text-rose-600 hover:bg-white'
                                  }`}
                                >
                                  ❤️
                                </button>
                              )}

                              {/* Bottom-Right Rating Tag */}
                              {item.averageRating > 0 && (
                                <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                                  ⭐ {item.averageRating}
                                </div>
                              )}
                            </div>

                            {/* Managed Product Details Below Image */}
                            <div className="space-y-1 min-w-0">
                              <h4
                                onClick={() => {
                                  setIsOpen(false);
                                  navigate(`/product/${item._id}`);
                                }}
                                className="text-xs sm:text-sm font-bold text-gray-900 truncate cursor-pointer hover:underline"
                                title={item.name}
                              >
                                {item.name}
                              </h4>

                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-sm font-black text-gray-900">
                                    ₹{item.price}
                                  </span>
                                  {item.discount > 0 && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-md">
                                      {item.discount}% OFF
                                    </span>
                                  )}
                                </div>

                                {(item.material || item.fabric || item.fit) && (
                                  <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">
                                    {item.fit ? `${item.fit} Fit` : (item.fabric || item.material)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-gray-100">
                              <button
                                onClick={() => addToCompare(item)}
                                title="Add to Compare List"
                                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 py-1.5 rounded-xl text-[11px] font-extrabold transition-all shadow-2xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer truncate"
                              >
                                ⚖️ <span>Compare</span>
                              </button>

                              <button
                                onClick={() => handleDirectAddToCart(item)}
                                title="Add to Cart"
                                className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 py-1.5 rounded-xl text-[11px] font-extrabold transition-all shadow-2xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer truncate"
                              >
                                🛒 <span>Add</span>
                              </button>

                              <button
                                onClick={() => {
                                  setIsOpen(false);
                                  navigate(`/product/${item._id}`);
                                }}
                                title="View Product Details"
                                className="w-full bg-slate-900 hover:bg-black text-white border border-slate-900 py-1.5 rounded-xl text-[11px] font-extrabold transition-all shadow-2xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer truncate"
                              >
                                ⚡ <span>View</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Complete Outfit to Cart Button */}
                    {msg.isOutfit && (
                      <button
                        onClick={() => handleAddOutfitToCart(msg.recommendations)}
                        className="w-full mt-2 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer truncate"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                        <span className="truncate">
                          🛒 Add Complete Outfit to Cart — ₹{msg.recommendations.reduce((sum, item) => sum + (item.price || 0), 0)}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* PRICE & SPECS COMPARISON CARDS */}
                {msg.comparisonList && msg.comparisonList.length > 0 && (
                  <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-3 shadow-xs space-y-2.5 max-w-full overflow-hidden mt-2">
                    <div className="flex items-center justify-between border-b border-indigo-200/70 pb-1.5 flex-wrap gap-1">
                      <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                        ⚖️ Live Price & Specs Comparison
                      </span>
                      <span className="text-[10px] text-indigo-900 font-bold">
                        {msg.comparisonList.length} Items Compared
                      </span>
                    </div>

                    <div className="space-y-2 max-w-full">
                      {msg.comparisonList.map((compItem, cIdx) => (
                        <div
                          key={compItem.id || cIdx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                            compItem.isTarget
                              ? 'bg-white border-indigo-400 ring-1 ring-indigo-300 shadow-2xs'
                              : 'bg-white/90 border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <img
                              src={compItem.image || assets.hero_img}
                              alt={compItem.name}
                              className="w-12 h-14 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                {compItem.isTarget && (
                                  <span className="text-[9px] bg-indigo-100 text-indigo-900 font-bold px-1.5 py-0.5 rounded uppercase">
                                    Selected
                                  </span>
                                )}
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                  compItem.priceNote.includes('CHEAPER')
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}>
                                  {compItem.priceNote}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-gray-900 truncate mt-0.5">{compItem.name}</h5>
                              <p className="text-xs font-black text-gray-900 flex items-center gap-1 mt-0.5">
                                ₹{compItem.price} <span className="text-[10px] text-gray-500 font-medium">• {compItem.rating}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleDirectAddToCart(compItem)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1"
                            >
                              🛒 Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-3 py-2 rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Light Theme Footer Input Bar */}
          <div className="p-2.5 sm:p-3 bg-white border-t border-gray-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt(inputQuery);
              }}
              className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 focus-within:border-gray-600 focus-within:bg-white transition-colors max-w-full"
            >
              {/* Input Field */}
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask 'Show me black t-shirts' or 'Party outfit under ₹3000'..."
                className="flex-1 bg-transparent text-xs outline-none text-gray-800 placeholder-gray-400 px-1 font-medium min-w-0"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-900 disabled:bg-gray-200 text-white transition-all hover:bg-black active:scale-95 cursor-pointer shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12L3 21l18-9L3 3l3 9zm0 0h75" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIFashionAssistant;
