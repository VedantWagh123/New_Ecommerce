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
                if (role === 'admin') {
                    // admin can just join 'admin' room
                    // Wait, admin's email needs to be verified. Our admin token is just jwt.sign(email+password)
                    if (decoded === process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
                        room = 'admin';
                    }
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
