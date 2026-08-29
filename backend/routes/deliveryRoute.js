import express from 'express';
import { acceptDelivery, getMyDeliveries, pickupOrder, deliverOrder, updateDeliveryStatus, collectCOD, getDeliveryEarnings, requestDeliveryPayout } from '../controllers/deliveryController.js';
import deliveryAuth from '../middleware/deliveryAuth.js';

const deliveryRouter = express.Router();


deliveryRouter.post('/accept', deliveryAuth, acceptDelivery);
deliveryRouter.get('/my-deliveries', deliveryAuth, getMyDeliveries);
deliveryRouter.post('/pickup', deliveryAuth, pickupOrder);
deliveryRouter.post('/deliver', deliveryAuth, deliverOrder);
deliveryRouter.post('/status', deliveryAuth, updateDeliveryStatus);
deliveryRouter.post('/collect-cod', deliveryAuth, collectCOD);

deliveryRouter.get('/earnings', deliveryAuth, getDeliveryEarnings);
deliveryRouter.post('/earnings/payout', deliveryAuth, requestDeliveryPayout);

export default deliveryRouter;
