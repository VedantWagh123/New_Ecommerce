import express from 'express';
import { uploadVideo, getVideosFeed, getMyVideos, deleteVideo, updateMetrics } from '../controllers/discoverController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';
import roleAuth from '../middleware/roleAuth.js';

const discoverRouter = express.Router();

// Public Routes (Customer Feed & Interactions)
discoverRouter.get('/feed', getVideosFeed);
discoverRouter.post('/metrics', updateMetrics);

// Admin/Seller Routes (Upload & Management)
// We will use adminAuth for simplicity since only admins/sellers can add products here.
discoverRouter.post('/upload', adminAuth, roleAuth(['super_admin', 'seller']), upload.single('video'), uploadVideo);
discoverRouter.get('/my-videos', adminAuth, roleAuth(['super_admin', 'seller']), getMyVideos);
discoverRouter.post('/delete', adminAuth, roleAuth(['super_admin', 'seller']), deleteVideo);

export default discoverRouter;
