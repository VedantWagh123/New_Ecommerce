import express from 'express';
import {
  addReview,
  getProductReviews,
  getUserEligibleReviews,
  adminGetAllReviews,
  adminToggleHideReview
} from '../controllers/reviewController.js';
import authUser from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import upload from '../middleware/multer.js';

const reviewRouter = express.Router();

// User endpoints
reviewRouter.post('/add', authUser, upload.array('images', 4), addReview);
reviewRouter.get('/product/:productId', getProductReviews);
reviewRouter.post('/user-eligible', authUser, getUserEligibleReviews);

// Admin endpoints
reviewRouter.get('/admin/all', adminAuth, adminGetAllReviews);
reviewRouter.post('/admin/toggle-hide', adminAuth, adminToggleHideReview);

export default reviewRouter;
