import express from 'express';
import { 
    requestSubscription, 
    getUserSubscriptionStatus, 
    getAdminSubscriptions, 
    approveSubscription, 
    rejectSubscription,
    deleteSubscription
} from '../controllers/subscriptionController.js';
import authUser from '../middleware/auth.js';

const subscriptionRouter = express.Router();

// User Endpoints
subscriptionRouter.post('/request', authUser, requestSubscription);
subscriptionRouter.post('/status', authUser, getUserSubscriptionStatus);

// Admin Endpoints
subscriptionRouter.get('/admin/list', getAdminSubscriptions);
subscriptionRouter.post('/admin/approve', approveSubscription);
subscriptionRouter.post('/admin/reject', rejectSubscription);
subscriptionRouter.post('/admin/delete', deleteSubscription);

export default subscriptionRouter;
