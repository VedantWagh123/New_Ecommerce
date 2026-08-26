import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import adminAuth from '../middleware/adminAuth.js';

const settingsRouter = express.Router();

settingsRouter.get('/', adminAuth, getSettings);
settingsRouter.post('/update', adminAuth, updateSettings);

export default settingsRouter;
