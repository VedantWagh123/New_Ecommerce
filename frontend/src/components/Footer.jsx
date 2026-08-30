import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
            <div className='flex items-center gap-2 mb-5'>
                <img src={assets.logo} className='w-28 sm:w-32 object-contain' alt="Store Logo" />
            </div>
            <p className='w-full md:w-2/3 text-gray-600 leading-relaxed'>
            Forever is a premium fashion destination dedicated to bringing you the finest collection of apparel and accessories. Our mission is to blend timeless elegance with modern trends, ensuring every customer feels confident and stylish.
            </p>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>COMPANY</p>
            <ul className='flex flex-col gap-2 text-gray-600'>
                <li><Link to='/' className='hover:text-black hover:underline transition-colors'>Home</Link></li>
                <li><Link to='/about' className='hover:text-black hover:underline transition-colors'>About us</Link></li>
                <li><Link to='/collection' className='hover:text-black hover:underline transition-colors'>Delivery</Link></li>
                <li><Link to='/privacy-policy' className='hover:text-black hover:underline transition-colors'>Privacy policy</Link></li>
                <li>
                    <a href="http://localhost:5175" target="_blank" rel="noopener noreferrer" className="text-black font-semibold hover:underline flex items-center gap-1">
                        <span>Sell on Forever</span>
                        <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold uppercase">Seller Hub</span>
                    </a>
                </li>
            </ul>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-2 text-gray-600'>
                <li>
                    <a href="tel:+12124567890" className='hover:text-black hover:underline transition-colors flex items-center gap-2'>
                        📞 +1-212-456-7890
                    </a>
                </li>
                <li>
                    <a href="mailto:contact@forever.com" className='hover:text-black hover:underline transition-colors flex items-center gap-2'>
                        ✉️ contact@forever.com
                    </a>
                </li>
            </ul>
        </div>

      </div>

        <div>
            <hr />
            <p className='py-5 text-sm text-center'>Copyright 2024@ forever.com - All Right Reserved.</p>
        </div>

    </div>
  )
}

export default Footer
