import React from 'react';
import { assets } from '../assets/assets';
import { LogOut, ShieldCheck, UserCheck } from 'lucide-react';

const Navbar = ({ setToken, setRole, role }) => {
  const getRoleName = (r) => {
    if (r === 'super_admin') return 'Super Admin';
    if (r === 'support') return 'Support Staff';
    if (r === 'marketing') return 'Marketing Admin';
    return 'Admin';
  }
  return (
    <header className='sticky top-0 z-40 w-full bg-white/80 backdrop-blur-lg border-b border-slate-200/80 px-[4%] py-3 flex items-center justify-between shadow-2xs transition-all'>
      <div className='flex items-center gap-3'>
        <img className='w-24 sm:w-32 object-contain' src={assets.logo} alt="Store Logo" />
        <span className='hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-white border border-slate-800 shadow-xs'>
          <ShieldCheck className='w-3.5 h-3.5 text-indigo-400' />
          Admin Panel
        </span>
      </div>

      <div className='flex items-center gap-4'>
        <div className='hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs font-semibold text-slate-700'>
          <div className='w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs'>
            <UserCheck className='w-4 h-4 text-emerald-400' />
          </div>
          <div className='text-left leading-tight'>
            <p className='font-bold text-slate-900 text-[11px]'>{getRoleName(role)}</p>
            <p className='text-[10px] text-slate-500 font-medium'>Control Center</p>
          </div>
        </div>

        <button
          onClick={() => {
            setToken('');
            setRole('');
          }}
          className='bg-slate-900 hover:bg-rose-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs hover:shadow flex items-center gap-2 active:scale-95 cursor-pointer'
        >
          <LogOut className='w-4 h-4' />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;