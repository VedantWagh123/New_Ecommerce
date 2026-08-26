import express from 'express';
import { getPlatformFinances, updatePayoutStatus } from '../controllers/financeController.js';
import adminAuth from '../middleware/adminAuth.js';
import roleAuth from '../middleware/roleAuth.js';

const financeRouter = express.Router();

// Only Super Admins should have access to Finances
financeRouter.get('/ledger', adminAuth, roleAuth(['super_admin']), getPlatformFinances);
financeRouter.post('/payout/update', adminAuth, roleAuth(['super_admin']), updatePayoutStatus);

export default financeRouter;
