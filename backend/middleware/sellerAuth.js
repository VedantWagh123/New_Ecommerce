import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const sellerAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not Authorized. Please login again.' });
        }
        
        const token = authHeader.split(' ')[1];
        if (!token || token === 'null' || token === 'undefined') {
            return res.status(401).json({ success: false, message: 'Not Authorized. Please login again.' });
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(token_decode.id);

        if (!user || (!user.isSeller && user.role !== 'seller')) {
            return res.status(403).json({ success: false, message: 'Access denied. Seller account required.' });
        }

        if (user.sellerStatus !== 'approved') {
            return res.status(403).json({ 
                success: false, 
                message: user.sellerStatus === 'pending' 
                    ? 'Your seller account application is pending admin approval.' 
                    : 'Your seller account application was rejected.',
                sellerStatus: user.sellerStatus,
                sellerRejectionReason: user.sellerRejectionReason || ''
            });
        }

        req.sellerId = user._id.toString();
        req.seller = user;
        req.body.sellerId = user._id.toString();

        next();
    } catch (error) {
        console.error("Seller Auth Error:", error);
        res.status(401).json({ success: false, message: error.message || 'Authentication failed' });
    }
};

export default sellerAuth;
