import express from 'express';
import { aiChat, visualSearch } from '../controllers/aiController.js';

const aiRouter = express.Router();

aiRouter.post('/chat', aiChat);
aiRouter.post('/visual-search', visualSearch);

export default aiRouter;
