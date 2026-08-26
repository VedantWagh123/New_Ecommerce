import React, { useContext, useEffect, useState, useRef } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets';
import { useLocation, useNavigate } from 'react-router-dom';
import VisualSearchModal from './VisualSearchModal';

const SearchBar = () => {
    const { search, setSearch, showSearch, setShowSearch, products } = useContext(ShopContext);
    const [showVisualModal, setShowVisualModal] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);

    // Auto-suggestions logic
    useEffect(() => {
        if (search.trim().length > 0) {
            const query = search.toLowerCase();
            const matches = products.filter(item => 
                item.name.toLowerCase().includes(query) || 
                item.category.toLowerCase().includes(query)
            );
            // Get top 5 unique suggestions
            setSuggestions(matches.slice(0, 5));
        } else {
            setSuggestions([]);
        }
    }, [search, products]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSuggestions([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter') {
            setShowSearch(false);
            setSuggestions([]);
            navigate('/collection');
        }
    };

    const handleSuggestionClick = (productId) => {
        setShowSearch(false);
        setSearch(''); // Clear search or keep it? Usually keep it or clear. Let's clear to reset.
        setSuggestions([]);
        navigate(`/product/${productId}`);
    };

    return showSearch ? (
        <div className='border-b bg-gray-50/95 backdrop-blur-md text-center relative z-50 transition-all duration-300'>
            <div className='inline-flex items-center justify-center border border-gray-300 px-5 py-2.5 my-4 mx-3 rounded-full w-11/12 sm:w-1/2 bg-white shadow-sm gap-2 relative transition-all focus-within:border-black focus-within:shadow-md' ref={dropdownRef}>
                <input 
                    value={search} 
                    onChange={(e)=>setSearch(e.target.value)} 
                    onKeyDown={handleSearchSubmit}
                    className='flex-1 outline-none bg-transparent text-sm text-gray-800 placeholder-gray-400' 
                    type="text" 
                    placeholder='Search for products, categories or brands (Press Enter)...'
                    autoFocus
                />
                
                <button
                    type="button"
                    onClick={() => setShowVisualModal(true)}
                    className="text-gray-500 hover:text-black transition-colors text-sm px-2 border-l border-gray-200 cursor-pointer flex items-center justify-center"
                    title="Search by Image or Camera"
                >
                    📷
                </button>

                <img 
                    className='w-4 cursor-pointer opacity-60 hover:opacity-100 transition-opacity' 
                    src={assets.search_icon} 
                    alt="Search" 
                    onClick={() => {
                        setShowSearch(false);
                        setSuggestions([]);
                        navigate('/collection');
                    }}
                />

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden text-left z-50 animate-fade-in max-h-80 overflow-y-auto">
                        <div className="px-4 py-2 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            Suggested Products
                        </div>
                        {suggestions.map((item) => (
                            <div 
                                key={item._id} 
                                onClick={() => handleSuggestionClick(item._id)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                            >
                                <img src={item.image[0]} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                                    <p className="text-xs text-gray-500 font-medium capitalize">{item.category} • {item.subCategory}</p>
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                    ${item.price}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <img 
                onClick={()=> {
                    setShowSearch(false);
                    setSuggestions([]);
                }} 
                className='inline w-3.5 cursor-pointer ml-2 opacity-60 hover:opacity-100 transition-opacity' 
                src={assets.cross_icon} 
                alt="Close" 
            />

            <VisualSearchModal
                isOpen={showVisualModal}
                onClose={() => setShowVisualModal(false)}
            />
        </div>
    ) : null
}

export default SearchBar
