import express from 'express';
import { uploadVideo, getVideosFeed, getMyVideos, deleteVideo, updateMetrics } from '../controllers/discoverController.js';
import upload from '../middleware/multer.js';
import sellerAuth from '../middleware/sellerAuth.js';
import jwt from 'jsonwebtoken';

const discoverRouter = express.Router();

const combinedAuth = async (req, res, next) => {
    try {
        let token = req.headers.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token || token === 'null' || token === 'undefined') {
            return res.json({success:false,message:"Not Authorized Login Again"});
        }
        
        const token_decode = jwt.verify(token,process.env.JWT_SECRET);
        if (typeof token_decode === 'string' && token_decode === process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            req.adminRole = 'super_admin';
            req.adminId = 'admin';
            return next();
        } else if (token_decode && token_decode.role) {
            req.adminId = token_decode.id;
            req.adminRole = token_decode.role;
            return next();
        } else {
            req.headers.authorization = `Bearer ${token}`;
            return sellerAuth(req, res, () => {
                req.adminRole = 'seller';
                req.adminId = req.sellerId;
                next();
            });
        }
    } catch(err) {
        return res.json({success:false,message:"Not Authorized Login Again"});
    }
};

// Public Routes (Customer Feed & Interactions)
discoverRouter.get('/feed', getVideosFeed);
discoverRouter.post('/metrics', updateMetrics);

// Admin/Seller Routes (Upload & Management)
discoverRouter.post('/upload', combinedAuth, upload.single('video'), uploadVideo);
discoverRouter.get('/my-videos', combinedAuth, getMyVideos);
discoverRouter.post('/delete', combinedAuth, deleteVideo);

export default discoverRouter;
