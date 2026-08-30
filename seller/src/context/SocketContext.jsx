import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../App';

export const SocketContext = createContext();

export const SocketProvider = ({ children, token, role }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (token && role) {
            const newSocket = io(backendUrl, {
                auth: { token, role }
            });
            setSocket(newSocket);

            newSocket.on('new-notification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                toast.info(`🔔 ${notification.title}: ${notification.message}`);
            });

            const fetchNotifications = () => {
                axios.get(backendUrl + '/api/notification', { 
                    headers: { 'x-role': role, Authorization: `Bearer ${token}` } 
                })
                .then(res => {
                    if (res.data.success) {
                        setNotifications(res.data.notifications);
                    }
                })
                .catch(console.error);
            };

            // Fetch initial notifications
            fetchNotifications();

            // Refetch on reconnect
            newSocket.on('connect', fetchNotifications);

            return () => newSocket.disconnect();
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            setNotifications([]);
        }
    }, [token, role]);

    const markAsRead = async (ids) => {
        try {
            await axios.post(backendUrl + '/api/notification/read', { notificationIds: ids }, { 
                headers: { 'x-role': role, Authorization: `Bearer ${token}` } 
            });
            setNotifications(prev => prev.map(n => ids.includes(n._id) ? { ...n, isRead: true } : n));
        } catch (e) {}
    };

    const markAllAsRead = async () => {
        try {
            await axios.post(backendUrl + '/api/notification/read-all', {}, { 
                headers: { 'x-role': role, Authorization: `Bearer ${token}` } 
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) {}
    };

    return (
        <SocketContext.Provider value={{ socket, notifications, markAsRead, markAllAsRead }}>
            {children}
        </SocketContext.Provider>
    );
};
