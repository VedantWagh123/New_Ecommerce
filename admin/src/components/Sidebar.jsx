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
  Settings,
  Truck
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
      to: '/delivery-partners',
      label: 'Fleet / Delivery',
      icon: Truck,
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
    <aside className='shrink-0 h-full overflow-y-auto custom-scrollbar w-[18%] min-w-[70px] md:min-w-[220px] border-r border-white/60 bg-white/40 backdrop-blur-2xl pt-6 px-2 sm:px-4 space-y-2 select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)]'>
      <div className='hidden md:block px-3 pb-3 border-b border-white/50 mb-2'>
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