import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // For admin, it can be 'admin'
    role: { type: String, enum: ['user', 'admin', 'seller', 'delivery'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    orderId: { type: String, default: null }, // Optional, for deep linking
    isRead: { type: Boolean, default: false },
    createdAt: { type: Number, default: Date.now }
});

const notificationModel = mongoose.models.notification || mongoose.model('notification', notificationSchema);
export default notificationModel;
