import express from 'express';
import { loginUser, registerUser, adminLogin, getSellers, approveSeller, rejectSeller, deleteSeller, getSubAdmins, addSubAdmin, deleteSubAdmin, getUserProfile, updateUserProfile, forgotPassword, resetPassword, verifyOtp, resendOtp } from '../controllers/userController.js';
import adminAuth from '../middleware/adminAuth.js';
import roleAuth from '../middleware/roleAuth.js';
import authUser from '../middleware/auth.js';
import upload from '../middleware/multer.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/verify-otp', verifyOtp)
userRouter.post('/resend-otp', resendOtp)
userRouter.post('/admin', adminLogin)

// Admin seller management
userRouter.get('/sellers', adminAuth, getSellers)
userRouter.post('/seller/approve', adminAuth, approveSeller)
userRouter.post('/reject-seller', adminAuth, rejectSeller);
userRouter.post('/delete-seller', adminAuth, deleteSeller);

// Sub-Admin Routes (Only Super Admin can access)
userRouter.get('/sub-admins', adminAuth, roleAuth(['super_admin']), getSubAdmins);
userRouter.post('/add-sub-admin', adminAuth, roleAuth(['super_admin']), addSubAdmin);
userRouter.post('/delete-sub-admin', adminAuth, roleAuth(['super_admin']), deleteSubAdmin);

// User Profile Routes
userRouter.get('/profile', authUser, getUserProfile);
userRouter.post('/update-profile', authUser, upload.single('avatar'), updateUserProfile);

// Password Reset Routes
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/reset-password', resetPassword);

export default userRouter;