import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  PackagePlus, 
  ShoppingBag, 
  Boxes, 
  BarChart3, 
  Wallet, 
  Star, 
  Store, 
  Settings, 
  LogOut,
  Flame,
  Video,
  ListVideo
} from 'lucide-react';

const Sidebar = ({ setToken, storeInfo, setSidebarOpen }) => {
  const handleLogout = () => {
    localStorage.removeItem('delivery_token');
    setToken('');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/orders', label: 'My Deliveries', icon: ShoppingBag },
    { path: '/earnings', label: 'Earnings & Payouts', icon: Wallet },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-full overflow-y-auto custom-scrollbar flex flex-col justify-between shrink-0 shadow-sm z-20">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md">
            F
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="prata-font font-bold text-lg text-slate-900 tracking-wider">VELOURA</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold uppercase border border-indigo-200">
                Delivery
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
              {storeInfo?.name || 'Wishmaster Portal'}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen && setSidebarOpen(false)}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
