import React, { useContext, useEffect, useState, useRef } from 'react'
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {

  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)

  const [name,setName] = useState('')
  const [password,setPasword] = useState('')
  const [email,setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);

  // OTP State
  const [otpPending, setOtpPending] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const inputRefs = useRef([]);

  const formatEmail = (emailStr) => {
    if (!emailStr) return '';
    const parts = emailStr.split('@');
    if (parts.length !== 2) return emailStr;
    const user = parts[0];
    const domain = parts[1];
    if (user.length <= 2) return emailStr;
    return `${user[0]}******${user[user.length - 1]}@${domain}`;
  };

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const onSubmitHandler = async (event) => {
      event.preventDefault();
      setIsLoading(true);
      try {
        if (currentState === 'Sign Up') {
          
          const response = await axios.post(backendUrl + '/api/user/register',{name,email,password})
          if (response.data.success) {
            setToken(response.data.token)
            localStorage.setItem('token',response.data.token)
          } else {
            toast.error(response.data.message)
          }

        } else {

          const response = await axios.post(backendUrl + '/api/user/login', {email,password})
          if (response.data.success) {
            if (response.data.otpPending) {
              setOtpPending(true);
              setTempToken(response.data.tempToken);
              setTimer(60);
              toast.success(response.data.message);
            } else {
              setToken(response.data.token)
              localStorage.setItem('token',response.data.token)
            }
          } else {
            toast.error(response.data.message)
          }

        }

      } catch (error) {
        console.log(error)
        toast.error(error.message)
      } finally {
        setIsLoading(false);
      }
  }

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (!/^[0-9]*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    let focusIndex = 0;
    
    pastedData.forEach((char, i) => {
      if (/^[0-9]$/.test(char) && i < 6) {
        newOtp[i] = char;
        focusIndex = i;
      }
    });
    
    setOtp(newOtp);
    if (focusIndex < 5) {
      inputRefs.current[focusIndex + 1].focus();
    } else {
      inputRefs.current[5].focus();
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return;

    setIsLoading(true);
    try {
      const response = await axios.post(backendUrl + '/api/user/verify-otp', {
        tempToken,
        otp: otpValue
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
      } else {
        toast.error(response.data.message);
        if (response.data.message.includes("expired") || response.data.message.includes("session")) {
           setOtpPending(false);
           setOtp(['', '', '', '', '', '']);
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onResendOtp = async () => {
    if (timer > 0) return;
    setIsLoading(true);
    try {
      const response = await axios.post(backendUrl + '/api/user/resend-otp', { tempToken });
      if (response.data.success) {
        toast.success(response.data.message);
        setTimer(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      } else {
        toast.error(response.data.message);
        if (response.data.message.includes("expired") || response.data.message.includes("session")) {
           setOtpPending(false);
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(()=>{
    if (token) {
      navigate('/')
    }
  },[token])

  if (otpPending) {
    return (
      <div className='flex flex-col items-center w-[90%] sm:max-w-[420px] m-auto mt-14 gap-4 text-gray-800 animate-fadeIn'>
        <div className='inline-flex items-center gap-2 mb-2 mt-10'>
            <p className='prata-regular text-3xl'>Verify Email</p>
            <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
        </div>
        <div className='text-center text-sm text-gray-600 mb-4'>
          <p>We sent a 6-digit verification code to</p>
          <p className='font-medium text-gray-900 mt-1'>{formatEmail(email)}</p>
        </div>

        <form onSubmit={onVerifyOtp} className='w-full flex flex-col items-center gap-6'>
          <div className='flex gap-2 justify-center w-full' onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type='text'
                inputMode='numeric'
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e, index)}
                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                className='w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all'
                disabled={isLoading}
              />
            ))}
          </div>

          <div className='text-sm text-gray-500'>
            {timer > 0 ? (
              <p>OTP expires in 00:{timer < 10 ? `0${timer}` : timer}</p>
            ) : (
              <p>OTP has expired.</p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isLoading || otp.join('').length !== 6}
            className={`w-full text-white font-light px-8 py-3 rounded-sm transition-all ${
              (isLoading || otp.join('').length !== 6) ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
            }`}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className='mt-4 text-sm'>
          <p className='text-gray-500 inline mr-2'>Didn't receive the code?</p>
          <button 
            type="button"
            onClick={onResendOtp} 
            disabled={timer > 0 || isLoading}
            className={`font-medium ${timer > 0 || isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors'}`}
          >
            {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
          </button>
        </div>
        <button onClick={() => { setOtpPending(false); setOtp(['', '', '', '', '', '']); setTimer(0); }} className='mt-2 text-xs text-gray-500 hover:text-gray-800 transition-colors underline'>Back to Login</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800 animate-fadeIn'>
        <div className='inline-flex items-center gap-2 mb-2 mt-10'>
            <p className='prata-regular text-3xl'>{currentState}</p>
            <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
        </div>
        {currentState === 'Login' ? '' : <input onChange={(e)=>setName(e.target.value)} value={name} type="text" className='w-full px-3 py-2 border border-gray-800 outline-none focus:border-indigo-500 transition-colors' placeholder='Name' required/>}
        <input onChange={(e)=>setEmail(e.target.value)} value={email} type="email" className='w-full px-3 py-2 border border-gray-800 outline-none focus:border-indigo-500 transition-colors' placeholder='Email' required/>
        <div className="relative w-full">
            <input onChange={(e)=>setPasword(e.target.value)} value={password} type={showPassword ? "text" : "password"} className='w-full px-3 py-2 border border-gray-800 outline-none focus:border-indigo-500 transition-colors pr-10' placeholder='Password' required/>
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
        <div className='w-full flex justify-between text-sm mt-[-8px]'>
            <p onClick={() => navigate('/forgot-password')} className='cursor-pointer hover:text-indigo-600 transition-colors'>Forgot your password?</p>
            {
              currentState === 'Login' 
              ? <p onClick={()=>setCurrentState('Sign Up')} className=' cursor-pointer hover:text-indigo-600 transition-colors'>Create account</p>
              : <p onClick={()=>setCurrentState('Login')} className=' cursor-pointer hover:text-indigo-600 transition-colors'>Login Here</p>
            }
        </div>
        <button disabled={isLoading} className={`w-full text-white font-light px-8 py-2 mt-4 transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}>
          {isLoading ? (currentState === 'Login' ? 'Verifying...' : 'Signing Up...') : (currentState === 'Login' ? 'Sign In' : 'Sign Up')}
        </button>
    </form>
  )
}

export default Login
