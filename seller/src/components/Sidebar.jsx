import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ListVideo,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Briefcase
} from 'lucide-react';

const Sidebar = ({ setToken, storeInfo }) => {
  const [expandedGroup, setExpandedGroup] = useState('');
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('seller_token');
    setToken('');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    {
      label: 'Catalog & Products',
      icon: FolderKanban,
      children: [
        { path: '/products', label: 'Products', icon: Package },
        { path: '/add-product', label: 'Add Product', icon: PackagePlus },
        { path: '/inventory', label: 'Inventory', icon: Boxes },
        { path: '/trending-requests', label: 'Trending Requests', icon: Flame }
      ]
    },
    {
      label: 'Sales & Finance',
      icon: Briefcase,
      children: [
        { path: '/orders', label: 'Orders', icon: ShoppingBag },
        { path: '/reviews', label: 'Reviews', icon: Star },
        { path: '/earnings', label: 'Earnings/Payouts', icon: Wallet }
      ]
    },
    {
      label: 'Media Studio',
      icon: Video,
      children: [
        { path: '/add-video', label: 'Upload Studio Video', icon: Video },
        { path: '/manage-videos', label: 'Manage Studio', icon: ListVideo }
      ]
    },
    {
      label: 'Settings',
      icon: Settings,
      children: [
        { path: '/store-profile', label: 'Store Profile', icon: Store },
        { path: '/settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  // Auto-expand group if a child route is active
  useEffect(() => {
    const currentPath = location.pathname;
    const activeGroup = navItems.find(item => 
      item.children && item.children.some(child => child.path === currentPath)
    );
    if (activeGroup) {
      setExpandedGroup(activeGroup.label);
    }
  }, [location.pathname]);

  const toggleGroup = (label) => {
    setExpandedGroup(prev => prev === label ? '' : label);
  };

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
              <span className="prata-font font-bold text-lg text-slate-900 tracking-wider">FOREVER</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold uppercase border border-slate-200">
                Seller
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
              {storeInfo?.storeName || 'Partner Portal'}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1">
          {navItems.map((item, index) => {
            if (item.children) {
              const Icon = item.icon;
              const isExpanded = expandedGroup === item.label;
              const isActiveChild = item.children.some(child => child.path === location.pathname);

              return (
                <div key={`group-${index}`} className="flex flex-col gap-1">
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      isActiveChild && !isExpanded
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : isExpanded
                        ? 'bg-slate-50 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="flex flex-col gap-1 pl-4 ml-3 border-l-2 border-slate-100 mt-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            end={child.path === '/'}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                                isActive
                                  ? 'bg-slate-900 text-white shadow-sm font-semibold'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                              }`
                            }
                          >
                            <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{child.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
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
