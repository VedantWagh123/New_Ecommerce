import React, { useState } from 'react';
import { Search, Calendar, Store, CheckCircle2, Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Navbar = ({ storeInfo, searchQuery, setSearchQuery, setSidebarOpen }) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const [isOnline, setIsOnline] = useState(storeInfo?.isOnline || false);

  React.useEffect(() => {
    if (storeInfo && storeInfo.isOnline !== undefined) {
      setIsOnline(storeInfo.isOnline);
    }
  }, [storeInfo]);

  const handleToggleOnline = async () => {
    const newState = !isOnline;
    setIsOnline(newState);
    try {
      const token = localStorage.getItem('delivery_token');
      const res = await axios.post(
        `${backendUrl}/api/user/toggle-delivery-online`,
        { isDeliveryOnline: newState, userId: storeInfo?.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.data.success) {
        setIsOnline(!newState);
        toast.error(res.data.message);
      }
    } catch (error) {
      setIsOnline(!newState);
      toast.error('Failed to update status');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs gap-4">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setSidebarOpen && setSidebarOpen(true)}
        className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Global Search */}
      <div className="relative flex-1 md:w-96 md:flex-none">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          placeholder="Search products, orders, SKU..."
          className="w-full pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
        />
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Date Selector Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDate}</span>
        </div>

        {/* Notifications Icon */}
        <NotificationBell />

        {/* Online/Offline Toggle */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isOnline ? 'Online' : 'Offline'}</span>
          <button 
            onClick={handleToggleOnline}
            className={`w-8 h-4 rounded-full relative transition-colors ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${isOnline ? 'left-4.5' : 'left-0.5'}`}></div>
          </button>
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-200"></div>

        {/* Store Profile Badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs shadow-xs">
            {storeInfo?.storeLogo ? (
              <img src={storeInfo.storeLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
            ) : (
              <Store className="w-4 h-4 text-slate-700" />
            )}
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {storeInfo?.name || 'Wishmaster'}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-50" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">Verified Partner</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
