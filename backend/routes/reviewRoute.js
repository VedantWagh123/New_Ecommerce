import express from 'express';
import {
  addReview,
  updateUserReview,
  deleteUserReview,
  getSingleUserReview,
  getProductReviews,
  getUserEligibleReviews,
  adminGetAllReviews,
  adminUpdateReviewStatus,
  adminDeleteReview
} from '../controllers/reviewController.js';
import authUser from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import upload from '../middleware/multer.js';

const reviewRouter = express.Router();

// User endpoints
reviewRouter.post('/add', authUser, upload.array('images', 4), addReview);
reviewRouter.post('/update', authUser, upload.array('images', 4), updateUserReview);
reviewRouter.delete('/delete', authUser, deleteUserReview);
reviewRouter.post('/user-review', authUser, getSingleUserReview);
reviewRouter.get('/product/:productId', getProductReviews);
reviewRouter.post('/user-eligible', authUser, getUserEligibleReviews);

// Admin endpoints
reviewRouter.get('/admin/all', adminAuth, adminGetAllReviews);
reviewRouter.post('/admin/status', adminAuth, adminUpdateReviewStatus);
reviewRouter.delete('/admin/delete', adminAuth, adminDeleteReview);

export default reviewRouter;
