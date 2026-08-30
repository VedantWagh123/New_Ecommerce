import express from 'express';
import { loginUser, registerUser, adminLogin, getSellers, approveSeller, rejectSeller, deleteSeller, getSubAdmins, addSubAdmin, deleteSubAdmin, getUserProfile, updateUserProfile, forgotPassword, verifyResetOtp, resetPassword, verifyOtp, resendOtp, applyDeliveryPartner, getDeliveryPartners, approveDeliveryPartner, rejectDeliveryPartner, toggleDeliveryOnline } from '../controllers/userController.js';
import adminAuth from '../middleware/adminAuth.js';
import roleAuth from '../middleware/roleAuth.js';
import authUser from '../middleware/auth.js';
import upload from '../middleware/multer.js';
import { authLimiter } from '../config/rateLimiter.js';

const userRouter = express.Router();

userRouter.post('/register', authLimiter, registerUser)
userRouter.post('/login', authLimiter, loginUser)
userRouter.post('/verify-otp', authLimiter, verifyOtp)
userRouter.post('/resend-otp', authLimiter, resendOtp)
userRouter.post('/admin', authLimiter, adminLogin)

// Admin seller management
userRouter.get('/sellers', adminAuth, getSellers)
userRouter.post('/seller/approve', adminAuth, approveSeller)
userRouter.post('/reject-seller', adminAuth, rejectSeller);
userRouter.post('/delete-seller', adminAuth, deleteSeller);

// Admin delivery partner management
userRouter.get('/delivery-partners', adminAuth, getDeliveryPartners)
userRouter.post('/delivery-partner/approve', adminAuth, approveDeliveryPartner)
userRouter.post('/delivery-partner/reject', adminAuth, rejectDeliveryPartner)

// User apply delivery partner
userRouter.post('/apply-delivery-partner', authUser, applyDeliveryPartner);
userRouter.post('/toggle-delivery-online', authUser, toggleDeliveryOnline);

// Sub-Admin Routes (Only Super Admin can access)
userRouter.get('/sub-admins', adminAuth, roleAuth(['super_admin']), getSubAdmins);
userRouter.post('/add-sub-admin', adminAuth, roleAuth(['super_admin']), addSubAdmin);
userRouter.post('/delete-sub-admin', adminAuth, roleAuth(['super_admin']), deleteSubAdmin);

// User Profile Routes
userRouter.get('/profile', authUser, getUserProfile);
userRouter.post('/update-profile', authUser, upload.single('avatar'), updateUserProfile);

// Password Reset Routes
userRouter.post('/forgot-password', authLimiter, forgotPassword);
userRouter.post('/verify-reset-otp', authLimiter, verifyResetOtp);
userRouter.post('/reset-password', authLimiter, resetPassword);

export default userRouter;