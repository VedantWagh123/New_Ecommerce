import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import notificationModel from '../models/notificationModel.js';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // allow all for dev
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        const { token, role } = socket.handshake.auth;

        if (token && token !== 'null' && token !== '') {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                let room = '';
                if (['admin', 'super_admin', 'support', 'marketing'].includes(role) || 
                    (decoded && ['admin', 'super_admin', 'support', 'marketing'].includes(decoded.role))) {
                    room = 'admin';
                } else if (role === 'seller') {
                    room = `seller_${decoded.id}`;
                } else if (role === 'delivery') {
                    room = `delivery_${decoded.id}`;
                } else {
                    room = `user_${decoded.id}`;
                }

                if (room) {
                    socket.join(room);
                    console.log(`Socket ${socket.id} joined room ${room}`);
                }
            } catch (err) {
                console.error("Socket authentication error:", err.message);
            }
        } else if (role === 'admin') {
           // Admin token might be different, wait, admin token isn't an object, it's a string, we check above.
        }

        socket.on('disconnect', () => {
            console.log('User disconnected', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized');
    }
    return io;
};

// Helper function to send notification and save to DB
export const sendNotification = async (role, userId, title, message, orderId = null) => {
    try {
        let targetUserId = userId;
        let room = '';

        if (role === 'admin') {
            targetUserId = 'admin';
            room = 'admin';
        } else {
            room = `${role}_${userId}`;
        }

        // Save to DB
        const newNotification = new notificationModel({
            userId: targetUserId,
            role,
            title,
            message,
            orderId
        });
        
        await newNotification.save();

        // Emit to room
        if (io) {
            io.to(room).emit('new-notification', newNotification);
        }
        
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

// Targeted Event Emitters to replace global broadcasts
export const emitOrderUpdate = (order) => {
    if (!io) return;
    
    // Always notify admins
    io.to('admin').emit('order-updated');

    if (!order) return;

    // Notify the customer
    if (order.userId) {
        io.to(`user_${order.userId}`).emit('order-updated');
    }

    // Notify the delivery partner
    if (order.deliveryPartnerId) {
        io.to(`delivery_${order.deliveryPartnerId}`).emit('order-updated');
    }

    // Notify involved sellers
    if (order.items && Array.isArray(order.items)) {
        const sellerIds = [...new Set(order.items.map(item => item.sellerId).filter(Boolean))];
        sellerIds.forEach(sellerId => {
            io.to(`seller_${sellerId}`).emit('order-updated');
        });
    }
};

export const emitProductUpdate = (product = null) => {
    if (!io) return;
    
    // Always notify admins
    io.to('admin').emit('product-updated');

    // Notify the specific seller if known, otherwise we don't broadcast to avoid overload.
    if (product && product.sellerId) {
        io.to(`seller_${product.sellerId}`).emit('product-updated');
    }
};

export const emitWishmasterUpdate = (userId) => {
    if (!io) return;
    
    io.to('admin').emit('wishmaster-updated');
    if (userId) {
        io.to(`user_${userId}`).emit('wishmaster-updated');
    }
};
