import express from 'express';
import { acceptDelivery, rejectDelivery, getMyDeliveries, pickupOrder, deliverOrder, updateDeliveryStatus, collectCOD, getDeliveryEarnings, requestDeliveryPayout, pickupReturn, deliverReturn, getLiveLocations } from '../controllers/deliveryController.js';
import deliveryAuth from '../middleware/deliveryAuth.js';
import adminAuth from '../middleware/adminAuth.js';

const deliveryRouter = express.Router();


deliveryRouter.post('/accept', deliveryAuth, acceptDelivery);
deliveryRouter.post('/reject', deliveryAuth, rejectDelivery);
deliveryRouter.get('/my-deliveries', deliveryAuth, getMyDeliveries);
deliveryRouter.post('/pickup', deliveryAuth, pickupOrder);
deliveryRouter.post('/deliver', deliveryAuth, deliverOrder);
deliveryRouter.post('/status', deliveryAuth, updateDeliveryStatus);
deliveryRouter.post('/collect-cod', deliveryAuth, collectCOD);

deliveryRouter.get('/earnings', deliveryAuth, getDeliveryEarnings);
deliveryRouter.post('/earnings/payout', deliveryAuth, requestDeliveryPayout);

deliveryRouter.post('/return/pickup', deliveryAuth, pickupReturn);
deliveryRouter.post('/return/deliver', deliveryAuth, deliverReturn);

// Admin Map Route
deliveryRouter.get('/live-locations', adminAuth, getLiveLocations);

export default deliveryRouter;
