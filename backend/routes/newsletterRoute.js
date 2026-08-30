import express from 'express';
import { subscribeNewsletter } from '../controllers/newsletterController.js';
import authUser from '../middleware/auth.js';

const newsletterRouter = express.Router();

newsletterRouter.post('/subscribe', authUser, subscribeNewsletter);

export default newsletterRouter;
