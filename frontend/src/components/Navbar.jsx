import React, { useContext, useState, useRef, useEffect } from 'react'
import {assets} from '../assets/assets'
import { Link, NavLink } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';
import VisualSearchModal from './VisualSearchModal';

const Navbar = () => {

    const [visible, setVisible] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showVisualSearch, setShowVisualSearch] = useState(false);
    const profileRef = useRef(null);
    const timeoutRef = useRef(null);

    const {setShowSearch, getCartCount, navigate, token, setToken, setCartItems, wishlist, sellerStatus, vipStatus, setCouponData} = useContext(ShopContext);

    const logout = () => {
        setIsProfileOpen(false);
        navigate('/login');
        localStorage.removeItem('token');
        setToken('');
        setCartItems({});
        setCouponData({ code: '', discount: 0 });
    }

    // Hover Handler with 150ms Grace Period
    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (token) setIsProfileOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsProfileOpen(false);
        }, 150);
    };

    // Toggle for Mobile/Tap & Desktop Click
    const handleProfileClick = (e) => {
        e.stopPropagation();
        if (!token) {
            navigate('/login');
        } else {
            setIsProfileOpen(prev => !prev);
        }
    };

    const handleOptionClick = (path) => {
        setIsProfileOpen(false);
        if (path) navigate(path);
    };

    // Click outside listener
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

  return (
    <div className='flex items-center justify-between py-5 font-medium'>
      
      <Link to='/' className='flex items-center gap-1'>
          <p className='prata-regular text-3xl font-medium tracking-widest text-black'>VELOURA</p>
          <div className='w-1.5 h-1.5 bg-black rounded-full mt-2'></div>
      </Link>

      <ul className='hidden sm:flex gap-5 text-sm text-gray-700'>
        
        <NavLink to='/' className='flex flex-col items-center gap-1'>
            <p>HOME</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/collection' className='flex flex-col items-center gap-1'>
            <p>COLLECTION</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/discover' className='flex flex-col items-center gap-1 group relative'>
            <p className="bg-clip-text font-bold flex items-center gap-1">
              <span>✨</span> STUDIO
            </p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/about' className='flex flex-col items-center gap-1'>
            <p>ABOUT</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/contact' className='flex flex-col items-center gap-1'>
            <p>CONTACT</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/membership' className='flex flex-col items-center gap-1 group relative'>
            <p className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-transparent bg-clip-text font-bold flex items-center gap-1">
              {vipStatus === 'active' ? (
                <><span>👑</span> VIP MEMBER</>
              ) : vipStatus === 'pending' ? (
                <><span>⏳</span> VIP PENDING</>
              ) : (
                <><span>👑</span> PREMIUM</>
              )}
            </p>
            <hr className='w-2/4 border-none h-[1.5px] bg-amber-500 hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-4 sm:gap-6'>
            <img onClick={()=> { setShowSearch(true); navigate('/collection') }} src={assets.search_icon} className='w-5 cursor-pointer' title="Text Search" alt="Search" />

            <button 
                onClick={() => setShowVisualSearch(true)} 
                className='text-gray-700 hover:text-black transition-colors cursor-pointer text-base leading-none p-1 rounded-full hover:bg-gray-100'
                title="Visual / Camera Search"
            >
                📷
            </button>
            
            <Link to='/wishlist' className='relative text-gray-700 hover:text-rose-600 transition-colors' title="My Wishlist">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlist?.length > 0 && (
                    <p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-rose-600 text-white aspect-square rounded-full text-[8px] font-bold animate-pulse'>
                        {wishlist.length}
                    </p>
                )}
            </Link>

            <div 
                ref={profileRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className='relative'
            >
                <img 
                    onClick={handleProfileClick} 
                    className='w-5 cursor-pointer hover:opacity-80 transition-opacity' 
                    src={assets.profile_icon} 
                    alt="Profile" 
                />
                
                {/* Dropdown Menu */}
                {token && (
                    <div 
                        className={`absolute right-0 top-full pt-2 z-50 transition-all duration-200 ease-out transform origin-top-right ${
                            isProfileOpen 
                                ? 'opacity-100 scale-100 pointer-events-auto block' 
                                : 'opacity-0 scale-95 pointer-events-none hidden'
                        }`}
                    >
                        <div className='flex flex-col gap-1 w-44 py-3 px-2 bg-white text-gray-600 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-gray-100'>
                            <p 
                                onClick={() => handleOptionClick('/profile')} 
                                className='cursor-pointer hover:bg-gray-100 hover:text-black px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs font-semibold'
                            >
                               My Profile
                            </p>
                            <p 
                                onClick={() => handleOptionClick('/orders')} 
                                className='cursor-pointer hover:bg-gray-100 hover:text-black px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs font-semibold'
                            >
                               Orders
                            </p>
                            <p 
                                onClick={() => handleOptionClick('/wishlist')} 
                                className='cursor-pointer hover:bg-gray-100 hover:text-black px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs font-semibold'
                            >
                               Wishlist ({wishlist?.length || 0})
                            </p>
                            <p 
                                onClick={() => { 
                                    setIsProfileOpen(false); 
                                    if (sellerStatus === 'approved' || sellerStatus === 'pending') {
                                        window.open(`http://localhost:5175/?sso_token=${token}`, '_blank');
                                    } else {
                                        navigate('/profile');
                                    }
                                }} 
                                className='cursor-pointer hover:bg-gray-100 hover:text-black px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs font-semibold border-t border-gray-100 pt-2'
                            >
                                {sellerStatus === 'approved' ? (
                                    <><span>🏪</span> <span>Seller Dashboard</span></>
                                ) : sellerStatus === 'pending' ? (
                                    <><span>⏳</span> <span>Application Pending</span></>
                                ) : sellerStatus === 'rejected' ? (
                                    <><span>❌</span> <span>Apply Again (Seller)</span></>
                                ) : (
                                    <><span>🛍️</span> <span>Become a Seller</span></>
                                )}
                            </p>
                            <hr className='my-1 border-gray-100' />
                            <p 
                                onClick={logout} 
                                className='cursor-pointer hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs font-semibold'
                            >
                               Logout
                            </p>
                        </div>
                    </div>
                )}
            </div>  
            <Link to='/cart' className='relative'>
                <img src={assets.cart_icon} className='w-5 min-w-5' alt="" />
                <p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]'>{getCartCount()}</p>
            </Link> 
            <img onClick={()=>setVisible(true)} src={assets.menu_icon} className='w-5 cursor-pointer sm:hidden' alt="" /> 
      </div>

        {/* Sidebar menu for small screens */}
        <div className={`fixed top-0 right-0 bottom-0 overflow-y-auto overflow-x-hidden bg-white transition-all z-[100] ${visible ? 'w-full' : 'w-0'}`}>
                <div className='flex flex-col text-gray-600 min-w-full'>
                    <div onClick={()=>setVisible(false)} className='flex items-center gap-4 p-3 cursor-pointer'>
                        <img className='h-4 rotate-180' src={assets.dropdown_icon} alt="" />
                        <p>Back</p>
                    </div>
                    <NavLink onClick={()=>setVisible(false)} className='py-2 pl-6 border' to='/'>HOME</NavLink>
                    <NavLink onClick={()=>setVisible(false)} className='py-2 pl-6 border' to='/collection'>COLLECTION</NavLink>
                    <NavLink onClick={()=>setVisible(false)} className='py-2 pl-6 border text-indigo-600 font-bold flex items-center gap-1' to='/discover'>✨ STUDIO</NavLink>
                    <NavLink onClick={()=>setVisible(false)} className='py-2 pl-6 border text-amber-600 font-bold flex items-center gap-1' to='/membership'>👑 PREMIUM — ₹1</NavLink>
                    <NavLink onClick={()=>setVisible(false)} className='py-2 pl-6 border' to='/about'>ABOUT</NavLink>
                    <NavLink onClick={()=>setVisible(false)} className='py-2 pl-6 border' to='/contact'>CONTACT</NavLink>
                    {/* Mobile Only Auth/Profile Links */}
                    <div className="mt-4 border-t pt-4">
                        {token ? (
                            <>
                                <NavLink onClick={()=>setVisible(false)} className='py-2 pl-6 border-b block font-semibold text-gray-800' to='/profile'>My Profile</NavLink>
                                <NavLink onClick={()=>setVisible(false)} className='py-2 pl-6 border-b block font-semibold text-gray-800' to='/orders'>My Orders</NavLink>
                                <NavLink onClick={()=>setVisible(false)} className='py-2 pl-6 border-b block font-semibold text-gray-800' to='/wishlist'>Wishlist ({wishlist?.length || 0})</NavLink>
                                <button onClick={() => { setVisible(false); logout(); }} className='w-full text-left py-2 pl-6 border-b font-semibold text-rose-600 block'>Logout</button>
                            </>
                        ) : (
                            <NavLink onClick={()=>setVisible(false)} className='py-2 pl-6 border-b block font-semibold text-indigo-600' to='/login'>Login / Register</NavLink>
                        )}
                    </div>
                </div>
        </div>

        {/* Visual Search Modal */}
        <VisualSearchModal 
            isOpen={showVisualSearch} 
            onClose={() => setShowVisualSearch(false)} 
        />

    </div>
  )
}

export default Navbar
