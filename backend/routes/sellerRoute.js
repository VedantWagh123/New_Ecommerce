import express from 'express';
import upload from '../middleware/multer.js';
import sellerAuth from '../middleware/sellerAuth.js';
import authUser from '../middleware/auth.js';
import { authLimiter } from '../config/rateLimiter.js';
import {
    registerSeller,
    applyForSeller,
    loginSeller,
    getSellerStatus,
    getSellerProfile,
    updateSellerProfile,
    getDashboardOverview,
    getSellerProducts,
    addSellerProduct,
    editSellerProduct,
    deleteSellerProduct,
    getSellerOrders,
    updateSellerOrderStatus,
    getInventory,
    updateStock,
    getAnalytics,
    getAdvancedProductAnalytics,
    getEarnings,
    requestPayout,
    getSellerReviews,
    deleteSelfAccount
} from '../controllers/sellerController.js';

const sellerRouter = express.Router();

// Public auth endpoints
sellerRouter.post('/register', authLimiter, registerSeller);
sellerRouter.post('/apply', authUser, applyForSeller);
sellerRouter.post('/login', authLimiter, loginSeller);
sellerRouter.get('/status', getSellerStatus);

// Protected Seller endpoints (Requires approved seller auth)
sellerRouter.get('/profile', sellerAuth, getSellerProfile);
sellerRouter.post('/profile/update', sellerAuth, updateSellerProfile);
sellerRouter.post('/delete-account', sellerAuth, deleteSelfAccount);

sellerRouter.get('/dashboard', sellerAuth, getDashboardOverview);

sellerRouter.get('/products', sellerAuth, getSellerProducts);
sellerRouter.post('/products/add', sellerAuth, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), addSellerProduct);
sellerRouter.post('/products/edit', sellerAuth, editSellerProduct);
sellerRouter.post('/products/delete', sellerAuth, deleteSellerProduct);

sellerRouter.get('/orders', sellerAuth, getSellerOrders);
sellerRouter.post('/orders/status', sellerAuth, updateSellerOrderStatus);

sellerRouter.get('/inventory', sellerAuth, getInventory);
sellerRouter.post('/inventory/update', sellerAuth, updateStock);

sellerRouter.get('/analytics', sellerAuth, getAnalytics);
sellerRouter.get('/analytics/advanced', sellerAuth, getAdvancedProductAnalytics);

sellerRouter.get('/earnings', sellerAuth, getEarnings);
sellerRouter.post('/earnings/payout', sellerAuth, requestPayout);

import { onboardRazorpayAccount } from '../controllers/sellerPaymentController.js';
sellerRouter.post('/onboard-razorpay', sellerAuth, onboardRazorpayAccount);

sellerRouter.get('/reviews', sellerAuth, getSellerReviews);

export default sellerRouter;
