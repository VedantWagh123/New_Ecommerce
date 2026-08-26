import express from 'express';
import { getActiveFlashSale, updateFlashSale } from '../controllers/flashSaleController.js';

const flashSaleRouter = express.Router();

// Public & User Endpoint
flashSaleRouter.get('/active', getActiveFlashSale);

// Admin Endpoint
flashSaleRouter.post('/update', updateFlashSale);

export default flashSaleRouter;
