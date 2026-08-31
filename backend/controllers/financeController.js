import orderModel from '../models/orderModel.js';
import payoutModel from '../models/payoutModel.js';
import userModel from '../models/userModel.js';
import settingsModel from '../models/settingsModel.js';
import { calculateSellerShare } from '../utils/financeUtils.js';

export const getPlatformFinances = async (req, res) => {
    try {
        const deliveredOrders = await orderModel.find({ status: 'Delivered' });
        const settings = await settingsModel.findOne();
        const commissionRate = settings ? (settings.platformCommission / 100) : 0.10;

        let grossSales = 0;
        let platformCommission = 0;
        let sellerEarnings = 0;
        let automatedPaid = 0; // Tracks amounts paid automatically via Razorpay Route

        deliveredOrders.forEach(order => {
            const uniqueSellers = [...new Set(order.items.map(i => i.sellerId).filter(id => id && id !== 'admin'))];
            
            uniqueSellers.forEach(sellerId => {
                const { sellerShare, platformCommission: comm } = calculateSellerShare(order, sellerId, commissionRate);
                
                platformCommission += comm;
                sellerEarnings += sellerShare;
                
                // Track Razorpay auto-transfers
                const sellerItems = order.items.filter(i => i.sellerId === sellerId);
                const hasRazorpayAccount = sellerItems.some(i => i.razorpayAccountId);
                if (order.paymentMethod === 'Razorpay' && order.payment && hasRazorpayAccount) {
                    automatedPaid += sellerShare;
                }
                
                // Track gross sales for these items
                const itemTotal = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                grossSales += itemTotal;
            });

            // Admin's own products
            const adminItems = order.items.filter(i => !i.sellerId || i.sellerId === 'admin');
            const adminTotal = adminItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            platformCommission += adminTotal;
            grossSales += adminTotal;
        });

        const allPayouts = await payoutModel.find({}).sort({ date: -1 });
        let manualPaid = 0;
        allPayouts.forEach(p => {
            if (p.status === 'completed') {
                manualPaid += p.amount;
            }
        });

        const totalPaid = manualPaid + automatedPaid;
        const pendingPayables = sellerEarnings - totalPaid;

        // Enrich payout requests with seller details
        const sellerIds = [...new Set(allPayouts.map(p => p.sellerId))];
        const sellers = await userModel.find({ _id: { $in: sellerIds } });
        const sellerMap = {};
        sellers.forEach(s => sellerMap[s._id.toString()] = s);

        const enrichedPayouts = allPayouts.map(p => ({
            ...p._doc,
            sellerName: sellerMap[p.sellerId]?.name || 'Unknown',
            storeName: sellerMap[p.sellerId]?.storeName || 'Unknown',
            email: sellerMap[p.sellerId]?.email || 'Unknown'
        }));

        res.json({
            success: true,
            summary: {
                grossSales,
                platformCommission,
                sellerEarnings,
                totalPaid,
                pendingPayables: pendingPayables > 0 ? pendingPayables : 0
            },
            payouts: enrichedPayouts
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePayoutStatus = async (req, res) => {
    try {
        const { payoutId, status, note } = req.body;
        const payout = await payoutModel.findById(payoutId);
        
        if (!payout) {
            return res.status(404).json({ success: false, message: 'Payout request not found' });
        }

        payout.status = status;
        if (note) payout.note = note;
        if (status === 'completed' && !payout.transactionId) {
            payout.transactionId = `TXN-${Date.now().toString().slice(-6).toUpperCase()}`;
        }

        await payout.save();
        res.json({ success: true, message: `Payout marked as ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
