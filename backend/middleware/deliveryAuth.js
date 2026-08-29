import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const deliveryAuth = async (req, res, next) => {
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

        if (!user || !user.isDeliveryPartner) {
            return res.status(403).json({ success: false, message: 'Access denied. Delivery Partner account required.' });
        }

        if (user.deliveryStatus !== 'approved') {
            return res.status(403).json({ 
                success: false, 
                message: user.deliveryStatus === 'pending' 
                    ? 'Your delivery partner application is pending admin approval.' 
                    : 'Your delivery partner application was rejected.',
                deliveryStatus: user.deliveryStatus
            });
        }

        req.deliveryPartnerId = user._id.toString();
        req.deliveryPartner = user;
        req.body.deliveryPartnerId = user._id.toString();

        next();
    } catch (error) {
        console.error("Delivery Auth Error:", error);
        res.status(401).json({ success: false, message: error.message || 'Authentication failed' });
    }
};

export default deliveryAuth;
