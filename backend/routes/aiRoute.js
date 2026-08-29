import express from 'express';
import { aiChat, visualSearch, nluSearch } from '../controllers/aiController.js';

const aiRouter = express.Router();

aiRouter.post('/chat', aiChat);
aiRouter.post('/visual-search', visualSearch);
aiRouter.post('/nlu-search', nluSearch);

export default aiRouter;
