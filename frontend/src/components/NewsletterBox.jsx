import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const NewsletterBox = () => {

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        
        if (!email) return;

        setLoading(true);
        try {
            const response = await axios.post(`${backendUrl}/api/newsletter/subscribe`, { email });
            
            if (response.data.success) {
                setIsSubscribed(true);
                toast.success(response.data.message);
                setEmail('');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

  return (
    <div className='text-center'>
      <p className='text-2xl font-medium text-gray-800'>Get 20% Off Your First Order</p>
      <p className='text-gray-500 mt-3 max-w-lg mx-auto'>
        Subscribe to get your exclusive discount code, new arrivals and special offers.
      </p>
      
      {!isSubscribed && (
        <p className='text-xs text-rose-500 font-semibold mt-1 tracking-wide uppercase'>
          *Valid for ONE order only.
        </p>
      )}
      
      {isSubscribed ? (
          <div className="mt-8 mb-4 p-6 bg-green-50 border border-green-200 rounded-xl inline-block shadow-sm">
            <h3 className="text-green-800 font-medium text-lg flex items-center justify-center gap-2">
               <span>🎉</span> You're on the list!
            </h3>
            <p className="text-green-600 mt-1 text-sm">
               Check your email for your exclusive 20% OFF discount code.
            </p>
          </div>
      ) : (
          <form onSubmit={onSubmitHandler} className='w-full sm:w-1/2 flex flex-col sm:flex-row items-center gap-0 sm:gap-3 mx-auto mt-6 border pl-0 sm:pl-3 rounded-md overflow-hidden sm:border-gray-300 border-transparent shadow-sm sm:shadow-none'>
            <input 
                className='w-full sm:flex-1 outline-none px-4 py-4 sm:py-0 border border-gray-300 sm:border-none rounded-md sm:rounded-none focus:ring-2 sm:focus:ring-0 focus:ring-black' 
                type="email" 
                placeholder='Enter your email address' 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
            />
            <button 
                type='submit' 
                disabled={loading}
                className='bg-black text-white text-xs px-10 py-4 font-medium tracking-wide hover:bg-gray-800 transition-colors mt-3 sm:mt-0 w-full sm:w-auto rounded-md sm:rounded-none disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center'
            >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    "GET 20% OFF"
                )}
            </button>
          </form>
      )}
    </div>
  )
}

export default NewsletterBox
