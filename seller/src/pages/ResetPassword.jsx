import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, LockKeyhole, ArrowRight } from 'lucide-react';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    // Determine backend URL, same as other seller pages
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(backendUrl + '/api/user/reset-password', { 
                token, 
                newPassword: password 
            });
            
            if (response.data.success) {
                toast.success(response.data.message);
                navigate('/login');
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
        <div className='min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gray-50'>
            <div className='bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-gray-100 max-w-[440px] w-full relative z-10'>
                
                {/* Header Icon */}
                <div className='w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm'>
                    <LockKeyhole className="w-7 h-7 text-gray-700" />
                </div>

                <h2 className='text-2xl font-extrabold text-gray-900 mb-2 tracking-tight'>Set new password</h2>
                <p className='text-sm text-gray-500 mb-8 leading-relaxed'>
                    Your new password must be different to previously used passwords.
                </p>
                
                <form onSubmit={onSubmitHandler} className='flex flex-col gap-5'>
                    <div className='flex flex-col gap-1'>
                        <label className='text-xs font-bold text-gray-600 uppercase tracking-wider pl-1'>New Password</label>
                        <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input 
                                onChange={(e) => setPassword(e.target.value)} 
                                value={password} 
                                type="password" 
                                className='w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:bg-white focus:border-gray-400 focus:ring-4 focus:ring-gray-100 transition-all text-sm font-medium text-gray-900' 
                                placeholder='••••••••' 
                                required 
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-1'>
                        <label className='text-xs font-bold text-gray-600 uppercase tracking-wider pl-1'>Confirm Password</label>
                        <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                value={confirmPassword} 
                                type="password" 
                                className='w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-none focus:bg-white focus:border-gray-400 focus:ring-4 focus:ring-gray-100 transition-all text-sm font-medium text-gray-900' 
                                placeholder='••••••••' 
                                required 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className='bg-gray-900 text-white font-semibold py-3.5 rounded-xl mt-4 hover:bg-gray-800 transition-all flex justify-center items-center shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            'Reset password'
                        )}
                    </button>
                </form>

                <div className='mt-8 text-center'>
                    <button onClick={() => navigate('/login')} className='text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1.5'>
                        <ArrowRight className="w-4 h-4 rotate-180" /> Back to log in
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
