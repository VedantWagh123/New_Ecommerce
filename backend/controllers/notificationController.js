import notificationModel from '../models/notificationModel.js';

// Get notifications for the authenticated user/role
const getNotifications = async (req, res) => {
    try {
        const { role, userId } = req.body; // passed by auth middleware or explicit
        
        let targetUserId = userId;
        if (!targetUserId && role === 'admin') {
            targetUserId = 'admin'; // generic ID for admin
        } else if (!targetUserId && req.body.userId) {
            targetUserId = req.body.userId;
        }

        const notifications = await notificationModel.find({ 
            userId: targetUserId, 
            role 
        }).sort({ createdAt: -1 }).limit(50); // Get latest 50

        res.json({ success: true, notifications });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Mark notifications as read
const markAsRead = async (req, res) => {
    try {
        const { notificationIds } = req.body; // Array of IDs to mark read
        
        await notificationModel.updateMany(
            { _id: { $in: notificationIds } },
            { $set: { isRead: true } }
        );

        res.json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Mark all as read
const markAllAsRead = async (req, res) => {
    try {
        const { role, userId } = req.body;
        
        let targetUserId = userId;
        if (!targetUserId && role === 'admin') {
            targetUserId = 'admin';
        }

        await notificationModel.updateMany(
            { userId: targetUserId, role, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { getNotifications, markAsRead, markAllAsRead };
