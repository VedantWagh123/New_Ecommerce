import express from 'express';
import { addCoupon, listCoupons, deleteCoupon, toggleCoupon, applyCoupon } from '../controllers/couponController.js';
import adminAuth from '../middleware/adminAuth.js';
import roleAuth from '../middleware/roleAuth.js';
import authUser from '../middleware/auth.js';

const couponRouter = express.Router();

// User Route (Apply Coupon)
couponRouter.post('/apply', authUser, applyCoupon);

// Admin Routes (Marketing & Super Admin)
couponRouter.post('/add', adminAuth, roleAuth(['super_admin', 'marketing']), addCoupon);
couponRouter.get('/list', adminAuth, roleAuth(['super_admin', 'marketing']), listCoupons);
couponRouter.post('/delete', adminAuth, roleAuth(['super_admin', 'marketing']), deleteCoupon);
couponRouter.post('/toggle', adminAuth, roleAuth(['super_admin', 'marketing']), toggleCoupon);

export default couponRouter;
