import React from 'react';
import { Search, Bell, Calendar, Store, CheckCircle2 } from 'lucide-react';

const Navbar = ({ storeInfo, searchQuery, setSearchQuery }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      {/* Global Search */}
      <div className="relative w-72 md:w-96">
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
        <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

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
                {storeInfo?.storeName || 'My Store'}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-50" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">Verified Seller</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
