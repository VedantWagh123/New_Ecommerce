import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Settings
} from 'lucide-react';

const Sidebar = ({ role }) => {
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
      to: '/stories',
      label: 'Story Highlights',
      icon: Layers,
      roles: ['super_admin', 'marketing']
    },
    {
      to: '/finances',
      label: 'Ledger & Payouts',
      icon: Wallet,
      badge: 'Finance',
      roles: ['super_admin']
    },
    {
      to: '/flash-sale',
      label: 'Flash Sale',
      icon: Flame,
      badge: 'Deal',
      roles: ['super_admin', 'marketing']
    },
    {
      to: '/subscriptions',
      label: 'Subscriptions',
      icon: Crown,
      badge: 'VIP',
      roles: ['super_admin', 'marketing']
    },
    {
      to: '/bank-offers',
      label: 'Bank Offers',
      icon: Landmark,
      badge: 'Offers',
      roles: ['super_admin', 'marketing']
    },
    {
      to: '/trending',
      label: 'Trending',
      icon: Flame,
      badge: 'Hot',
      roles: ['super_admin', 'marketing']
    },
    {
      to: '/add',
      label: 'Add Items',
      icon: PlusCircle,
      roles: ['super_admin']
    },
    {
      to: '/list',
      label: 'List Items',
      icon: PackageSearch,
      roles: ['super_admin']
    },
    {
      to: '/add-video',
      label: 'Upload Studio Video',
      icon: Video,
      roles: ['super_admin', 'marketing', 'seller']
    },
    {
      to: '/manage-videos',
      label: 'Manage Videos',
      icon: Layers,
      roles: ['super_admin', 'marketing', 'seller']
    },
    {
      to: '/orders',
      label: 'Orders',
      icon: ShoppingBag,
      roles: ['super_admin', 'support']
    },
    {
      to: '/reviews',
      label: 'Reviews',
      icon: Star,
      roles: ['super_admin']
    },
    {
      to: '/sellers',
      label: 'Sellers Hub',
      icon: Store,
      roles: ['super_admin']
    },
    {
      to: '/product-approvals',
      label: 'Product Approvals',
      icon: ShieldCheck,
      roles: ['super_admin']
    },
    {
      to: '/coupons',
      label: 'Coupons Engine',
      icon: Ticket,
      roles: ['super_admin', 'marketing'],
      badge: 'Beta'
    },
    {
      to: '/sub-admins',
      label: 'Manage Admins',
      icon: Users,
      roles: ['super_admin']
    },
    {
      to: '/settings',
      label: 'Global Settings',
      icon: Settings,
      roles: ['super_admin'],
      badge: 'Core'
    }
  ];

  // Filter items based on role
  const visibleNavItems = navItems.filter(item => {
    if (!item.roles) return true; // Accessible by everyone (e.g. Dashboard)
    return item.roles.includes(role || 'super_admin'); 
  });

  return (
    <aside className='shrink-0 h-full overflow-y-auto custom-scrollbar w-[18%] min-w-[70px] md:min-w-[220px] border-r border-slate-200/90 bg-white/70 backdrop-blur-md pt-6 px-2 sm:px-4 space-y-2 select-none'>
      <div className='hidden md:block px-3 pb-3 border-b border-slate-100 mb-2'>
        <p className='text-[10px] font-black uppercase tracking-widest text-slate-400'>
          Navigation Menu
        </p>
      </div>

      <nav className='flex flex-col gap-1.5 text-xs sm:text-sm font-medium pb-10'>
        {visibleNavItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl border transition-all duration-200 group ${
                  isActive
                    ? 'active-sidebar-item'
                    : 'text-slate-600 border-transparent hover:bg-slate-100/80 hover:text-slate-900'
                }`
              }
            >
              <div className='flex items-center gap-3 truncate'>
                <IconComponent className='w-5 h-5 shrink-0 transition-transform group-hover:scale-110' />
                <span className='hidden md:inline-block font-semibold truncate'>{item.label}</span>
              </div>

              {item.badge && (
                <span className='hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className='hidden md:block pt-8 px-3'>
        <div className='p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-slate-700 text-xs space-y-2'>
          <div className='flex items-center gap-2 font-bold text-indigo-700'>
            <span className='w-2 h-2 rounded-full bg-emerald-500 animate-ping' />
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