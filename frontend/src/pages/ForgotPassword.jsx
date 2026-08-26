import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Mail, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const { backendUrl } = useContext(ShopContext);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const onSubmitHandler = async (e) => {
        if (e) e.preventDefault();
        if (!email) return toast.error("Please enter your email");
        
        setLoading(true);
        try {
            const response = await axios.post(backendUrl + '/api/user/forgot-password', { email });
            if (response.data.success) {
                toast.success(response.data.message);
                setIsSent(true);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden'>
            {/* Background Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-full max-h-[500px] bg-gradient-to-tr from-indigo-200/40 via-purple-200/40 to-pink-200/40 blur-3xl -z-10 rounded-full mix-blend-multiply opacity-70"></div>

            <div className='bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-white max-w-[440px] w-full relative z-10'>
                
                {/* Header Icon */}
                <div className='w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100/50'>
                    {isSent ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    ) : (
                        <KeyRound className="w-7 h-7 text-indigo-600" />
                    )}
                </div>

                <h2 className='text-2xl font-extrabold text-gray-900 mb-2 tracking-tight'>
                    {isSent ? 'Check your email' : 'Forgot Password?'}
                </h2>
                
                {isSent ? (
                    <div className='animate-fade-in'>
                        <p className='text-sm text-gray-500 mb-8 leading-relaxed'>
                            We've sent a secure password reset link to <span className="font-semibold text-gray-900">{email}</span>. Please check your inbox and spam folder.
                        </p>
                        
                        <div className='flex flex-col gap-3'>
                            <button 
                                onClick={() => window.open('https://mail.google.com', '_blank')}
                                className='w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-indigo-500/25 flex justify-center items-center gap-2'
                            >
                                Open Gmail <ArrowRight className="w-4 h-4" />
                            </button>
                            
                            <button 
                                onClick={onSubmitHandler}
                                disabled={loading}
                                className='w-full bg-white text-gray-700 border border-gray-200 font-semibold py-3.5 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all flex justify-center items-center'
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></span>
                                ) : (
                                    'Resend link'
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className='animate-fade-in'>
                        <p className='text-sm text-gray-500 mb-8 leading-relaxed'>
                            No worries, we'll send you reset instructions. Please enter the email associated with your account.
                        </p>
                        <form onSubmit={onSubmitHandler} className='flex flex-col gap-5'>
                            <div className='relative'>
                                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    value={email} 
                                    type="email" 
                                    className='w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all text-sm font-medium text-gray-900 placeholder:font-normal placeholder:text-gray-400' 
                                    placeholder='Enter your email' 
                                    required 
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className='bg-gray-900 text-white font-semibold py-3.5 rounded-xl mt-2 hover:bg-gray-800 transition-all flex justify-center items-center shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    'Send reset instructions'
                                )}
                            </button>
                        </form>
                    </div>
                )}

                <div className='mt-8 text-center'>
                    <Link to="/login" className='text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5'>
                        <ArrowRight className="w-4 h-4 rotate-180" /> Back to log in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
