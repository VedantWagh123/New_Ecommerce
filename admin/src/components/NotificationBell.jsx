import React, { useContext, useState, useRef, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Bell, ExternalLink } from 'lucide-react';

const NotificationBell = () => {
    const { notifications, markAsRead, markAllAsRead } = useContext(SocketContext) || { notifications: [], markAsRead: () => {}, markAllAsRead: () => {} };
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Map notification title → admin route + state
    const getNavTarget = (notification) => {
        const title = notification.title?.toLowerCase() || '';
        const orderId = notification.orderId;

        // Order events → go to Orders page
        if (
            title.includes('new order') ||
            title.includes('order') ||
            title.includes('delivered') ||
            title.includes('picked up') ||
            title.includes('in transit') ||
            title.includes('out for delivery') ||
            title.includes('delivery accepted') ||
            title.includes('cancelled') ||
            title.includes('cod collected') ||
            title.includes('return') ||
            title.includes('refund') ||
            title.includes('qc')
        ) {
            return { path: '/orders', state: orderId ? { openOrderId: orderId } : {} };
        }

        // Product approval requests
        if (
            title.includes('product') ||
            title.includes('approval') ||
            title.includes('approved') ||
            title.includes('rejected')
        ) {
            return { path: '/product-approvals', state: {} };
        }

        // Seller / payout related
        if (title.includes('payout') || title.includes('seller payout') || title.includes('payment')) {
            return { path: '/finances', state: {} };
        }

        // Trending
        if (title.includes('trending')) {
            return { path: '/trending', state: {} };
        }

        // Review / rating
        if (title.includes('review') || title.includes('rating')) {
            return { path: '/reviews', state: {} };
        }

        // Default → orders
        return orderId ? { path: '/orders', state: { openOrderId: orderId } } : null;
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead([notification._id]);
        }
        setIsOpen(false);
        const target = getNavTarget(notification);
        if (target) {
            navigate(target.path, { state: target.state });
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-700 hover:text-black transition-colors"
            >
                <Bell className="w-5 h-5" strokeWidth={2} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-[340px] bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-400">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const target = getNavTarget(notification);
                                return (
                                    <div
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors group ${
                                            !notification.isRead ? 'bg-indigo-50/40 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm flex-1 mr-2 ${!notification.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                {notification.title}
                                            </h4>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {target && (
                                                    <ExternalLink className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-0.5 flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(notification.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {target && (
                                                <span className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Tap to open →
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
