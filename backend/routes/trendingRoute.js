import express from 'express';
import {
  getActiveTrendingProducts,
  getAdminTrendingProducts,
  configureTrending,
  removeTrending,
  deleteProductAdmin,
  sellerRequestTrending,
  getSellerTrendingRequests
} from '../controllers/trendingController.js';
import adminAuth from '../middleware/adminAuth.js';
import sellerAuth from '../middleware/sellerAuth.js';

const trendingRouter = express.Router();

// Public route for customer homepage
trendingRouter.get('/active', getActiveTrendingProducts);

// Admin routes (Requires admin authentication)
trendingRouter.get('/admin/list', adminAuth, getAdminTrendingProducts);
trendingRouter.post('/admin/configure', adminAuth, configureTrending);
trendingRouter.post('/admin/remove', adminAuth, removeTrending);
trendingRouter.post('/admin/delete-product', adminAuth, deleteProductAdmin);

// Seller routes (Requires seller authentication)
trendingRouter.post('/seller/request', sellerAuth, sellerRequestTrending);
trendingRouter.get('/seller/list', sellerAuth, getSellerTrendingRequests);

export default trendingRouter;
