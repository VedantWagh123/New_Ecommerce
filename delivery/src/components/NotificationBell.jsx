import React, { useContext, useState, useRef, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import { formatDateTimeIST } from '../utils/formatIST';

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

    // Map notification title → delivery route + state
    const getNavTarget = (notification) => {
        const title = notification.title?.toLowerCase() || '';
        const orderId = notification.orderId;

        // New assignment → Dashboard (new assignments section)
        if (title.includes('assigned') || title.includes('new delivery') || title.includes('new assignment')) {
            return { path: '/', state: {} };
        }

        // Active delivery events → Orders page
        if (
            title.includes('accepted') ||
            title.includes('picked up') ||
            title.includes('in transit') ||
            title.includes('out for delivery') ||
            title.includes('delivered') ||
            title.includes('order') ||
            title.includes('cod') ||
            title.includes('return') ||
            title.includes('cancel')
        ) {
            return { path: '/orders', state: orderId ? { openOrderId: orderId } : {} };
        }

        // Earnings / payout
        if (title.includes('earn') || title.includes('payout') || title.includes('payment') || title.includes('wallet')) {
            return { path: '/earnings', state: {} };
        }

        // Default → dashboard
        return { path: '/', state: {} };
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
                className={`relative p-2.5 rounded-xl transition-all ${
                    isOpen || unreadCount > 0 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600 text-white items-center justify-center text-[9px] font-bold border-2 border-white shadow-sm">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-[320px] sm:w-[380px] bg-white rounded-3xl shadow-2xl overflow-hidden z-50 border border-slate-100 animate-fade-in origin-top-right transform transition-all">
                    <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="px-6 py-12 text-center flex flex-col items-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                    <Bell className="w-5 h-5 text-slate-300" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-700">All caught up!</h4>
                                <p className="text-xs text-slate-400 mt-1">You have no new notifications.</p>
                            </div>
                        ) : (
                            <div className="py-2">
                                {notifications.map((notification) => {
                                    const target = getNavTarget(notification);
                                    return (
                                        <div
                                            key={notification._id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`px-5 py-4 cursor-pointer transition-all group border-l-4 ${
                                                !notification.isRead
                                                    ? 'border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60'
                                                    : 'border-transparent hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm flex-1 mr-2 ${!notification.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                    {notification.title}
                                                </h4>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {target && (
                                                        <ExternalLink className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0 shadow-sm" />
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDateTimeIST(notification.createdAt)}
                                                </span>
                                                {target && (
                                                    <span className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Open →
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
