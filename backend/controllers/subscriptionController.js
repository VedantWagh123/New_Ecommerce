import subscriptionModel from "../models/subscriptionModel.js";
import userModel from "../models/userModel.js";

/**
 * User requests ₹1 VIP Subscription
 * POST /api/subscription/request
 */
export const requestSubscription = async (req, res) => {
    try {
        const { plan, amount, userName: bodyName, userEmail: bodyEmail, paymentMethod } = req.body;
        const targetUserId = req.body.userId || req.userId;

        if (!targetUserId) {
            return res.status(400).json({ success: false, message: "User authentication required. Please login." });
        }

        let user = await userModel.findById(targetUserId);
        
        const finalUserName = user?.name || bodyName || "Valued Customer";
        const finalUserEmail = user?.email || bodyEmail || "customer@veloura.com";

        // Check if user already has an active or pending subscription
        const existingSub = await subscriptionModel.findOne({ userId: targetUserId }).sort({ requestDate: -1 });

        if (existingSub) {
            if (existingSub.status === 'active' && existingSub.expiryDate > Date.now()) {
                return res.json({
                    success: true,
                    message: "You are already an Active VIP Gold Member!",
                    subscription: existingSub
                });
            }
            if (existingSub.status === 'pending') {
                return res.json({
                    success: true,
                    message: "Your subscription request is already pending Admin approval.",
                    subscription: existingSub
                });
            }
        }

        const newSubscription = new subscriptionModel({
            userId: targetUserId,
            userName: finalUserName,
            userEmail: finalUserEmail,
            plan: plan || 'TRIAL_1RS',
            amount: Number(amount) || 1,
            status: 'pending',
            requestDate: Date.now(),
            note: paymentMethod ? `Paid via ${paymentMethod}` : '₹1 Payment Completed'
        });

        await newSubscription.save();

        res.json({
            success: true,
            message: "Payment of ₹1 Successful! Subscription request submitted for Admin approval.",
            subscription: newSubscription
        });
    } catch (error) {
        console.error("Request Subscription Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get Subscription status for logged in user
 * POST /api/subscription/status
 */
export const getUserSubscriptionStatus = async (req, res) => {
    try {
        const { userId } = req.body;
        const targetUserId = userId || req.userId;

        if (!targetUserId) {
            return res.json({ success: true, vipStatus: 'none', subscription: null });
        }

        const subscription = await subscriptionModel.findOne({ userId: targetUserId }).sort({ requestDate: -1 });

        if (!subscription) {
            return res.json({ success: true, vipStatus: 'none', subscription: null });
        }

        // Auto expire check
        if (subscription.status === 'active' && subscription.expiryDate && subscription.expiryDate < Date.now()) {
            subscription.status = 'expired';
            await subscription.save();
            return res.json({ success: true, vipStatus: 'expired', subscription });
        }

        res.json({
            success: true,
            vipStatus: subscription.status,
            subscription
        });
    } catch (error) {
        console.error("Get Subscription Status Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Admin: List all subscription requests
 * GET /api/subscription/admin/list
 */
export const getAdminSubscriptions = async (req, res) => {
    try {
        const subscriptions = await subscriptionModel.find({}).sort({ requestDate: -1 });
        res.json({
            success: true,
            subscriptions
        });
    } catch (error) {
        console.error("Get Admin Subscriptions Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Admin: Approve subscription request
 * POST /api/subscription/admin/approve
 */
export const approveSubscription = async (req, res) => {
    try {
        const { id } = req.body;
        const subscription = await subscriptionModel.findById(id);

        if (!subscription) {
            return res.status(404).json({ success: false, message: "Subscription request not found" });
        }

        const now = Date.now();
        const durationDays = subscription.plan === 'ANNUAL' ? 365 : 30;

        subscription.status = 'active';
        subscription.approvedDate = now;
        subscription.expiryDate = now + (durationDays * 24 * 60 * 60 * 1000);
        await subscription.save();

        res.json({
            success: true,
            message: `VIP Access Approved for ${subscription.userName}!`,
            subscription
        });
    } catch (error) {
        console.error("Approve Subscription Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Admin: Reject subscription request
 * POST /api/subscription/admin/reject
 */
export const rejectSubscription = async (req, res) => {
    try {
        const { id, note } = req.body;
        const subscription = await subscriptionModel.findById(id);

        if (!subscription) {
            return res.status(404).json({ success: false, message: "Subscription request not found" });
        }

        subscription.status = 'rejected';
        subscription.note = note || 'Rejected by Admin';
        await subscription.save();

        res.json({
            success: true,
            message: `Subscription request rejected for ${subscription.userName}`,
            subscription
        });
    } catch (error) {
        console.error("Reject Subscription Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Admin: Remove / Revoke Subscription
 * POST /api/subscription/admin/delete
 */
export const deleteSubscription = async (req, res) => {
    try {
        const { id } = req.body;
        const subscription = await subscriptionModel.findByIdAndDelete(id);

        if (!subscription) {
            return res.status(404).json({ success: false, message: "Subscription record not found" });
        }

        res.json({
            success: true,
            message: `VIP Subscription removed for ${subscription.userName}`,
            subscription
        });
    } catch (error) {
        console.error("Delete Subscription Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
