import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
            <div className='flex items-center gap-1 mb-5'>
                <p className='prata-regular text-2xl font-medium tracking-widest text-black'>VELOURA</p>
                <div className='w-1.5 h-1.5 bg-black rounded-full mt-2'></div>
            </div>
            <p className='w-full md:w-2/3 text-gray-600 leading-relaxed'>
            Veloura is a premium fashion destination dedicated to bringing you the finest collection of apparel and accessories. Our mission is to blend timeless elegance with modern trends, ensuring every customer feels confident and stylish.
            </p>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>COMPANY</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li>Home</li>
                <li>About us</li>
                <li>Delivery</li>
                <li>Privacy policy</li>
                <li>
                    <a href="http://localhost:5175" target="_blank" rel="noopener noreferrer" className="text-black font-semibold hover:underline flex items-center gap-1">
                        <span>Sell on Veloura</span>
                        <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold uppercase">Seller Hub</span>
                    </a>
                </li>
            </ul>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li>+1-212-456-7890</li>
                <li>+1-212-456-7890</li>
                <li>contact@veloura.com</li>
            </ul>
        </div>

      </div>

        <div>
            <hr />
            <p className='py-5 text-sm text-center'>Copyright 2024@ veloura.com - All Right Reserved.</p>
        </div>

    </div>
  )
}

export default Footer
