import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  PackageSearch,
  ShoppingBag,
  Star,
  Store,
  ShieldCheck,
  Flame,
  Landmark,
  Crown,
  Users,
  Ticket,
  Wallet,
  BarChart3,
  Layers,
  Video,
  Settings,
  Truck,
  ChevronDown,
  ChevronRight,
  Megaphone,
  FolderKanban,
  Briefcase
} from 'lucide-react';

const Sidebar = ({ role }) => {
  const [expandedGroup, setExpandedGroup] = useState('');
  const location = useLocation();

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
      roles: ['super_admin', 'support', 'marketing']
    },
    {
      to: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      roles: ['super_admin', 'marketing']
    },
    {
      label: 'Promotions & Offers',
      icon: Megaphone,
      roles: ['super_admin', 'marketing'],
      children: [
        { to: '/trending', label: 'Trending', icon: Flame, badge: 'Hot' },
        { to: '/flash-sale', label: 'Flash Sale', icon: Flame, badge: 'Deal' },
        { to: '/bank-offers', label: 'Bank Offers', icon: Landmark, badge: 'Offers' },
        { to: '/coupons', label: 'Coupons Engine', icon: Ticket, badge: 'Beta' }
      ]
    },
    {
      label: 'Content Studio',
      icon: Video,
      roles: ['super_admin', 'marketing'],
      children: [
        { to: '/stories', label: 'Story Highlights', icon: Layers },
        { to: '/add-video', label: 'Upload Studio Video', icon: Video },
        { to: '/manage-videos', label: 'Manage Videos', icon: Layers }
      ]
    },
    {
      label: 'Catalog Management',
      icon: FolderKanban,
      roles: ['super_admin'],
      children: [
        { to: '/add', label: 'Add Items', icon: PlusCircle },
        { to: '/list', label: 'List Items', icon: PackageSearch },
        { to: '/product-approvals', label: 'Product Approvals', icon: ShieldCheck }
      ]
    },
    {
      label: 'Sales & Finance',
      icon: Briefcase,
      roles: ['super_admin', 'support'],
      children: [
        { to: '/orders', label: 'Orders', icon: ShoppingBag },
        { to: '/reviews', label: 'Reviews', icon: Star },
        { to: '/finances', label: 'Ledger & Payouts', icon: Wallet, badge: 'Finance' },
        { to: '/subscriptions', label: 'Subscriptions', icon: Crown, badge: 'VIP' }
      ]
    },
    {
      label: 'Users & Network',
      icon: Users,
      roles: ['super_admin'],
      children: [
        { to: '/sellers', label: 'Sellers Hub', icon: Store },
        { to: '/delivery-partners', label: 'Fleet / Delivery', icon: Truck },
        { to: '/live-map', label: 'Live GPS Map', icon: Truck, badge: 'Live' },
        { to: '/sub-admins', label: 'Manage Admins', icon: Users }
      ]
    },
    {
      to: '/settings',
      label: 'Global Settings',
      icon: Settings,
      roles: ['super_admin'],
      badge: 'Core'
    }
  ];

  // Auto-expand group if a child route is active
  useEffect(() => {
    const currentPath = location.pathname;
    const activeGroup = navItems.find(item => 
      item.children && item.children.some(child => child.to === currentPath)
    );
    if (activeGroup) {
      setExpandedGroup(activeGroup.label);
    }
  }, [location.pathname]);

  const toggleGroup = (label) => {
    setExpandedGroup(prev => prev === label ? '' : label);
  };

  // Filter items based on role
  const visibleNavItems = navItems.filter(item => {
    if (!item.roles) return true; // Accessible by everyone
    return item.roles.includes(role || 'super_admin'); 
  });

  return (
    <aside className='shrink-0 h-full overflow-y-auto custom-scrollbar w-[18%] min-w-[70px] md:min-w-[220px] border-r border-white/60 bg-white/40 backdrop-blur-2xl pt-6 px-2 sm:px-4 space-y-2 select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)]'>
      <div className='hidden md:block px-3 pb-3 border-b border-white/50 mb-2'>
        <p className='text-[10px] font-black uppercase tracking-widest text-slate-400'>
          Navigation Menu
        </p>
      </div>

      <nav className='flex flex-col gap-1.5 text-xs sm:text-sm font-medium pb-10'>
        {visibleNavItems.map((item, index) => {
          if (item.children) {
            const IconComponent = item.icon;
            const isExpanded = expandedGroup === item.label;
            const isActiveChild = item.children.some(child => child.to === location.pathname);

            return (
              <div key={`group-${index}`} className="flex flex-col gap-1">
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl border transition-all duration-300 group ${
                    isActiveChild && !isExpanded
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      : isExpanded
                      ? 'bg-slate-100 text-slate-900 border-transparent shadow-sm'
                      : 'text-slate-600 border-transparent hover:bg-white/80 hover:shadow-sm hover:text-indigo-600'
                  }`}
                >
                  <div className='flex items-center gap-3 truncate'>
                    <IconComponent className={`w-5 h-5 shrink-0 transition-transform ${isExpanded ? 'text-indigo-600' : 'text-slate-500 group-hover:text-indigo-500'}`} />
                    <span className='hidden md:inline-block font-semibold truncate'>{item.label}</span>
                  </div>
                  <div className='hidden md:block shrink-0 text-slate-400'>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="hidden md:flex flex-col gap-1 pl-4 ml-4 border-l-2 border-indigo-100 mt-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end={child.to === '/'}
                          className={({ isActive }) =>
                            `flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 group ${
                              isActive
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-[0_4px_12px_rgba(99,102,241,0.25)]'
                                : 'text-slate-500 border-transparent hover:bg-indigo-50 hover:text-indigo-700'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className='flex items-center gap-2.5 truncate'>
                                <ChildIcon className={`w-4 h-4 shrink-0 ${!isActive ? 'text-slate-400 group-hover:text-indigo-500' : ''}`} />
                                <span className='font-semibold truncate text-[13px]'>{child.label}</span>
                              </div>
                              {child.badge && (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                  isActive 
                                    ? 'bg-white/20 text-white border-white/30' 
                                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                }`}>
                                  {child.badge}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Render standard NavLink for items without children
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl border transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-[0_8px_16px_rgba(99,102,241,0.25)]'
                    : 'text-slate-600 border-transparent hover:bg-white/80 hover:shadow-sm hover:text-indigo-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className='flex items-center gap-3 truncate'>
                    <IconComponent className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${!isActive ? 'text-slate-500 group-hover:text-indigo-500' : ''}`} />
                    <span className='hidden md:inline-block font-semibold truncate'>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      isActive 
                        ? 'bg-white/20 text-white border-white/30' 
                        : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className='hidden md:block pt-8 px-3'>
        <div className='p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-slate-700 text-xs space-y-2 relative overflow-hidden'>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
          <div className='flex items-center gap-2 font-bold text-indigo-700 relative z-10'>
            <span className='w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]' />
            <span>Store Operations</span>
          </div>
          <p className='text-[11px] text-slate-500 leading-normal font-medium'>
            Analytics update automatically in real-time.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;