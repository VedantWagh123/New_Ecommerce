import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const About = () => {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden pb-10">
      {/* Light Wavy Animated Background */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-rose-50/50 blur-3xl rounded-full opacity-70 -translate-y-1/2 pointer-events-none animate-[blob_10s_infinite]"></div>
      <div className="absolute bottom-0 right-0 w-full h-[600px] bg-gradient-to-tl from-sky-50/50 via-teal-50/30 to-indigo-50/50 blur-3xl rounded-full opacity-70 translate-y-1/3 pointer-events-none animate-[blob_15s_infinite_reverse]"></div>

      <div className="relative z-10">
        <div className='text-2xl text-center pt-8 border-t border-gray-100'>
            <Title text1={'ABOUT'} text2={'US'} />
        </div>

        <div className='my-10 flex flex-col md:flex-row gap-16 px-4 sm:px-10 lg:px-20'>
            {/* Image with subtle floating animation and glow */}
            <div className="w-full md:w-1/2 relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition duration-1000"></div>
                <img 
                    className='w-full object-cover rounded-2xl shadow-sm relative z-10 transform group-hover:-translate-y-2 transition-transform duration-700 ease-out' 
                    src={assets.about_img} 
                    alt="About Forever" 
                />
            </div>
            
            <div className='flex flex-col justify-center gap-6 md:w-1/2 text-gray-600'>
                <h3 className="text-2xl font-black text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    The Next Generation of Commerce
                </h3>
                <p className="leading-relaxed">
                    Forever was born out of a passion for timeless elegance and a desire to redefine the modern wardrobe. Our journey began with a simple vision: to merge premium fashion with cutting-edge artificial intelligence, creating a shopping experience that feels magical.
                </p>
                <p className="leading-relaxed">
                    We've evolved beyond a traditional store. Today, Forever is an intelligent ecosystem. Whether you are using our <span className="font-bold text-gray-900">AI Visual Search</span> to find an outfit from a photo, or experiencing our immersive <span className="font-bold text-gray-900">Video Commerce Studio</span>, we bring the future of shopping directly to you.
                </p>
                <b className='text-gray-900 text-lg mt-2'>Our Mission</b>
                <p className="leading-relaxed">
                    Our mission is to empower our community with confidence and grace while removing all friction from shopping. With our <span className="font-bold text-gray-900">Virtual Try-On</span> and <span className="font-bold text-gray-900">Agentic Stylist</span>, we ensure you always find the perfect fit and style effortlessly.
                </p>
            </div>
        </div>

        <div className='text-xl py-4 mt-10'>
            <Title text1={'WHY'} text2={'CHOOSE US'} />
        </div>

        <div className='flex flex-col md:flex-row text-sm mb-20 px-4 sm:px-10 lg:px-20 gap-6'>
            {/* Box 1 */}
            <div className='flex-1 bg-white/60 backdrop-blur-md border border-gray-100 rounded-3xl p-10 flex flex-col gap-5 hover:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.15)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group'>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-indigo-100 transition-colors duration-500"></div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl shadow-inner relative z-10 group-hover:scale-110 transition-transform duration-500">📸</div>
              <b className="text-gray-900 text-lg relative z-10">AI Visual Search</b>
              <p className='text-gray-600 leading-relaxed relative z-10'>
                Saw something you like? Just upload a picture. Our neural network instantly scans our catalog to find exact matches or visually similar items in less than 2 seconds.
              </p>
            </div>
            
            {/* Box 2 */}
            <div className='flex-1 bg-white/60 backdrop-blur-md border border-gray-100 rounded-3xl p-10 flex flex-col gap-5 hover:shadow-[0_10px_40px_-10px_rgba(217,70,239,0.15)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group'>
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-50 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-fuchsia-100 transition-colors duration-500"></div>
              <div className="w-12 h-12 rounded-xl bg-fuchsia-50 flex items-center justify-center text-2xl shadow-inner relative z-10 group-hover:scale-110 transition-transform duration-500">🤖</div>
              <b className="text-gray-900 text-lg relative z-10">Agentic Stylist</b>
              <p className='text-gray-600 leading-relaxed relative z-10'>
                Chat with our advanced AI assistant to curate head-to-toe outfits for any occasion. It understands your budget, fit preferences, and adds items directly to your cart.
              </p>
            </div>
            
            {/* Box 3 */}
            <div className='flex-1 bg-white/60 backdrop-blur-md border border-gray-100 rounded-3xl p-10 flex flex-col gap-5 hover:shadow-[0_10px_40px_-10px_rgba(14,165,233,0.15)] hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group'>
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-sky-100 transition-colors duration-500"></div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-2xl shadow-inner relative z-10 group-hover:scale-110 transition-transform duration-500">🎥</div>
              <b className="text-gray-900 text-lg relative z-10">Video Commerce</b>
              <p className='text-gray-600 leading-relaxed relative z-10'>
                Experience fashion in motion. Our immersive Studio feed lets you discover viral trends and shop products directly while watching engaging Reels-style videos.
              </p>
            </div>
        </div>

        <div className="px-4 sm:px-10 lg:px-20">
            <NewsletterBox/>
        </div>
      </div>

      <style>{`
        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>
    </div>
  )
}

export default About
