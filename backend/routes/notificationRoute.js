import express from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';
import deliveryAuth from '../middleware/deliveryAuth.js';
import sellerAuth from '../middleware/sellerAuth.js';

const notificationRouter = express.Router();

// A generic wrapper to handle the different roles seamlessly
const roleBasedAuth = (req, res, next) => {
    const role = req.headers['x-role']; // We can pass role from frontend
    
    if (role === 'admin') {
        req.body.role = 'admin';
        req.body.userId = 'admin';
        return adminAuth(req, res, next);
    } else if (role === 'seller') {
        req.body.role = 'seller';
        return sellerAuth(req, res, () => {
            req.body.userId = req.sellerId;
            next();
        });
    } else if (role === 'delivery') {
        req.body.role = 'delivery';
        return deliveryAuth(req, res, () => {
            req.body.userId = req.deliveryPartnerId;
            next();
        });
    } else {
        // default to user
        req.body.role = 'user';
        return authUser(req, res, next);
    }
};

notificationRouter.get('/', roleBasedAuth, getNotifications);
notificationRouter.post('/read', roleBasedAuth, markAsRead);
notificationRouter.post('/read-all', roleBasedAuth, markAllAsRead);

export default notificationRouter;
