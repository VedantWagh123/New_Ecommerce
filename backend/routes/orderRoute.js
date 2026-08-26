import express from 'express'
import {placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, deleteOrder, verifyStripe, verifyRazorpay, getAdminAnalytics} from '../controllers/orderController.js'
import adminAuth  from '../middleware/adminAuth.js'
import roleAuth from '../middleware/roleAuth.js'
import authUser from '../middleware/auth.js'

const orderRouter = express.Router()

// Admin Features
orderRouter.post('/list',adminAuth,roleAuth(['super_admin', 'support']),allOrders)
orderRouter.post('/status',adminAuth,roleAuth(['super_admin', 'support']),updateStatus)
orderRouter.post('/delete',adminAuth,roleAuth(['super_admin']),deleteOrder)
orderRouter.get('/admin-analytics', adminAuth, roleAuth(['super_admin']), getAdminAnalytics)

// Payment Features
orderRouter.post('/place',authUser,placeOrder)
orderRouter.post('/stripe',authUser,placeOrderStripe)
orderRouter.post('/razorpay',authUser,placeOrderRazorpay)

// User Feature 
orderRouter.post('/userorders',authUser,userOrders)

// verify payment
orderRouter.post('/verifyStripe',authUser, verifyStripe)
orderRouter.post('/verifyRazorpay',authUser, verifyRazorpay)

export default orderRouter