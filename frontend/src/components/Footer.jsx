import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { assets } from '../assets/assets'

const Footer = () => {
  const { pathname } = useLocation();
  const isPremium = pathname === '/membership';

  return (
    <div className={`transition-colors duration-700 ease-in-out ${isPremium ? 'text-zinc-300' : 'text-gray-900'}`}>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
            <div className='flex items-center gap-2 mb-5'>
                <img src={assets.logo} className={`w-28 sm:w-32 object-contain transition-all duration-700 ${isPremium ? 'brightness-0 invert opacity-90' : ''}`} alt="Store Logo" />
            </div>
            <p className={`w-full md:w-2/3 leading-relaxed transition-colors duration-700 ${isPremium ? 'text-zinc-400' : 'text-gray-600'}`}>
            Forever is a premium fashion destination dedicated to bringing you the finest collection of apparel and accessories. Our mission is to blend timeless elegance with modern trends, ensuring every customer feels confident and stylish.
            </p>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>COMPANY</p>
            <ul className={`flex flex-col gap-2 transition-colors duration-700 ${isPremium ? 'text-zinc-400' : 'text-gray-600'}`}>
                <li><Link to='/' className={`hover:underline transition-colors ${isPremium ? 'hover:text-yellow-400' : 'hover:text-black'}`}>Home</Link></li>
                <li><Link to='/about' className={`hover:underline transition-colors ${isPremium ? 'hover:text-yellow-400' : 'hover:text-black'}`}>About us</Link></li>
                <li><Link to='/collection' className={`hover:underline transition-colors ${isPremium ? 'hover:text-yellow-400' : 'hover:text-black'}`}>Delivery</Link></li>
                <li><Link to='/privacy-policy' className={`hover:underline transition-colors ${isPremium ? 'hover:text-yellow-400' : 'hover:text-black'}`}>Privacy policy</Link></li>
            </ul>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
            <ul className={`flex flex-col gap-2 transition-colors duration-700 ${isPremium ? 'text-zinc-400' : 'text-gray-600'}`}>
                <li>
                    <a href="http://localhost:5175" target="_blank" rel="noopener noreferrer" className={`font-semibold hover:underline flex items-center gap-1 ${isPremium ? 'text-zinc-300' : 'text-black'}`}>
                        <span>Sell on Forever</span>
                        <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold uppercase">Seller Hub</span>
                    </a>
                </li>
                <li>
                    <a href="tel:+12124567890" className={`hover:underline transition-colors flex items-center gap-2 ${isPremium ? 'hover:text-yellow-400' : 'hover:text-black'}`}>
                        📞 +1-212-456-7890
                    </a>
                </li>
                <li>
                    <a href="mailto:contact@forever.com" className={`hover:underline transition-colors flex items-center gap-2 ${isPremium ? 'hover:text-yellow-400' : 'hover:text-black'}`}>
                        ✉️ contact@forever.com
                    </a>
                </li>
            </ul>
        </div>

      </div>

        <div className={`border-t transition-colors duration-700 ${isPremium ? 'border-zinc-800' : 'border-gray-200'}`}>
            <div className={`py-6 flex flex-col md:flex-row items-center justify-between text-sm transition-colors duration-700 ${isPremium ? 'text-zinc-500' : 'text-gray-500'}`}>
                <p>
                    © {new Date().getFullYear()} Forever Fashion. All rights reserved.
                </p>
                <div className='flex gap-4 mt-3 md:mt-0'>
                    <a href="#" className={`transition-colors ${isPremium ? 'hover:text-yellow-400' : 'hover:text-black'}`}>Terms of Service</a>
                    <Link to="/privacy-policy" className={`transition-colors ${isPremium ? 'hover:text-yellow-400' : 'hover:text-black'}`}>Privacy Policy</Link>
                    <a href="#" className={`transition-colors ${isPremium ? 'hover:text-yellow-400' : 'hover:text-black'}`}>Cookies</a>
                </div>
            </div>
        </div>

    </div>
  )
}

export default Footer
