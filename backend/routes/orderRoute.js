import express from 'express'
import {placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, deleteOrder, verifyStripe, verifyRazorpay, getAdminAnalytics, requestCancellation, approveCancellation, rejectCancellation, assignWishmaster, requestReturn, processRefund} from '../controllers/orderController.js'
import adminAuth  from '../middleware/adminAuth.js'
import roleAuth from '../middleware/roleAuth.js'
import authUser from '../middleware/auth.js'

const orderRouter = express.Router()

// Admin Features
orderRouter.post('/list',adminAuth,roleAuth(['super_admin', 'support']),allOrders)
orderRouter.post('/status',adminAuth,roleAuth(['super_admin', 'support']),updateStatus)
orderRouter.post('/delete',adminAuth,roleAuth(['super_admin']),deleteOrder)
orderRouter.get('/admin-analytics', adminAuth, roleAuth(['super_admin']), getAdminAnalytics)
orderRouter.post('/assign-wishmaster', adminAuth, roleAuth(['super_admin', 'support']), assignWishmaster)

// Payment Features
orderRouter.post('/place',authUser,placeOrder)
orderRouter.post('/stripe',authUser,placeOrderStripe)
orderRouter.post('/razorpay',authUser,placeOrderRazorpay)

// User Feature 
orderRouter.post('/userorders',authUser,userOrders)

// verify payment
orderRouter.post('/verifyStripe',authUser, verifyStripe)
orderRouter.post('/verifyRazorpay',authUser, verifyRazorpay)

// Cancellation Features
orderRouter.post('/cancel/request', authUser, requestCancellation)
orderRouter.post('/cancel/approve', adminAuth, roleAuth(['super_admin', 'support']), approveCancellation)
orderRouter.post('/cancel/reject', adminAuth, roleAuth(['super_admin', 'support']), rejectCancellation)

// Return & Refund Features
orderRouter.post('/return/request', authUser, requestReturn)
orderRouter.post('/refund/process', adminAuth, roleAuth(['super_admin', 'support', 'finance']), processRefund)

export default orderRouter