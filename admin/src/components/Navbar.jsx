import React from 'react';
import { assets } from '../assets/assets';
import { LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = ({ setToken, setRole, role }) => {
  const getRoleName = (r) => {
    if (r === 'super_admin') return 'Super Admin';
    if (r === 'support') return 'Support Staff';
    if (r === 'marketing') return 'Marketing Admin';
    return 'Admin';
  }
  return (
    <header className='sticky top-0 z-40 w-full bg-white/40 backdrop-blur-2xl border-b border-white/60 px-[4%] py-3 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all'>
      <div className='flex items-center gap-3'>
        <img className='w-24 sm:w-32 object-contain' src={assets.logo} alt="Store Logo" />
        <span className='hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-white border border-slate-800 shadow-xs'>
          <ShieldCheck className='w-3.5 h-3.5 text-indigo-400' />
          Admin Panel
        </span>
      </div>

      <div className='flex items-center gap-4'>
        <NotificationBell />
        <div className='hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/60 border border-white/80 shadow-sm text-xs font-semibold text-slate-700 backdrop-blur-md'>
          <div className='w-7 h-7 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm'>
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
          className='bg-gradient-to-r from-slate-800 to-slate-900 hover:from-rose-500 hover:to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-2xl text-xs font-bold transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(225,29,72,0.3)] flex items-center gap-2 active:scale-95 cursor-pointer'
        >
          <LogOut className='w-4 h-4' />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;