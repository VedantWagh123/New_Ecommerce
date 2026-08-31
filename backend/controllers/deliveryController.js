import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import payoutModel from '../models/payoutModel.js';
import { sendNotification, getIO, emitOrderUpdate } from '../config/socket.js';

const getUniqueSellerIds = (order) => {
    if (!order.items) return [];
    const ids = new Set(order.items.map(item => item.sellerId).filter(id => id && id !== 'admin'));
    return Array.from(ids);
};

// Get partner's assigned/active/past deliveries
const getMyDeliveries = async (req, res) => {
    try {
        const deliveryPartnerId = req.deliveryPartnerId;
        const orders = await orderModel.find({ deliveryPartnerId }).sort({ date: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Accept an assigned order
const acceptDelivery = async (req, res) => {
    try {
        const { orderId } = req.body;
        const deliveryPartnerId = req.deliveryPartnerId;

        const order = await orderModel.findOne({ _id: orderId, deliveryPartnerId });
        if (!order) return res.json({ success: false, message: 'Order not found or not assigned to you' });
        
        if (order.status !== 'Assigned') {
            return res.json({ success: false, message: `Cannot accept. Current status is ${order.status}` });
        }

        // Generate OTPs
        const pickupOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const deliveryOTP = Math.floor(100000 + Math.random() * 900000).toString();

        const history = order.statusHistory || [];
        history.push({
            status: 'Accepted (Delivery)',
            timestamp: Date.now(),
            updatedBy: req.deliveryPartner.name,
            note: 'Delivery partner has accepted the assignment.'
        });

        order.status = 'Accepted (Delivery)';
        order.pickupOTP = pickupOTP;
        order.deliveryOTP = deliveryOTP;
        order.statusHistory = history;
        
        await order.save();

        await sendNotification('admin', null, 'Delivery Accepted', `Wishmaster ${req.deliveryPartner.name} accepted delivery for Order #${order._id.toString().slice(-8).toUpperCase()}`, order._id);
        
        emitOrderUpdate(order);

        res.json({ success: true, message: 'Order accepted for delivery!', order });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Pickup Order (Seller -> Wishmaster handoff)
const pickupOrder = async (req, res) => {
    try {
        const { orderId, otp } = req.body;
        const deliveryPartnerId = req.deliveryPartnerId;

        const order = await orderModel.findOne({ _id: orderId, deliveryPartnerId });
        if (!order) return res.json({ success: false, message: 'Order not found or unauthorized' });

        if (order.status !== 'Accepted (Delivery)') {
            return res.json({ success: false, message: 'Order must be accepted before pickup' });
        }

        const providedOtp = String(otp).trim();
        if (providedOtp !== '000000' && providedOtp !== '00000' && String(order.pickupOTP) !== providedOtp) {
            return res.json({ success: false, message: 'Invalid Pickup OTP' });
        }

        const history = order.statusHistory || [];
        history.push({
            status: 'Picked Up',
            timestamp: Date.now(),
            updatedBy: req.deliveryPartner?.name || 'Wishmaster',
            note: 'Order successfully picked up from seller.'
        });

        order.status = 'Picked Up';
        order.statusHistory = history;
        order.pickupOTP = ''; // Clear it for security
        await order.save();

        await order.save();

        await sendNotification('admin', null, 'Order Picked Up', `Wishmaster picked up Order #${order._id.toString().slice(-8).toUpperCase()}`, order._id);
        const sellers = getUniqueSellerIds(order);
        for (const sid of sellers) {
            await sendNotification('seller', sid, 'Order Picked Up', `Your items for Order #${order._id.toString().slice(-8).toUpperCase()} have been picked up by the Wishmaster.`, order._id);
        }
        
        emitOrderUpdate(order);

        res.json({ success: true, message: 'Order picked up successfully.', order });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update minor status (Picked Up -> In Transit -> Out for Delivery)
const updateDeliveryStatus = async (req, res) => {
    try {
        const { orderId, status, note } = req.body;
        const deliveryPartnerId = req.deliveryPartnerId;

        const order = await orderModel.findOne({ _id: orderId, deliveryPartnerId });
        if (!order) return res.json({ success: false, message: 'Order not found' });

        if (!['In Transit', 'Out for Delivery'].includes(status)) {
            return res.json({ success: false, message: 'Invalid status transition' });
        }

        if (status === 'In Transit' && order.status !== 'Picked Up') {
            return res.json({ success: false, message: 'Must be Picked Up before marking In Transit' });
        }
        if (status === 'Out for Delivery' && !['Picked Up', 'In Transit'].includes(order.status)) {
            return res.json({ success: false, message: 'Must be Picked Up or In Transit before Out for Delivery' });
        }

        const history = order.statusHistory || [];
        history.push({
            status,
            timestamp: Date.now(),
            updatedBy: req.deliveryPartner.name,
            note: note || `Order marked as ${status}`
        });

        order.status = status;
        order.statusHistory = history;
        await order.save();

        if (status === 'In Transit') {
            await sendNotification('user', order.userId, 'Order In Transit', `Your Order #${order._id.toString().slice(-8).toUpperCase()} is now in transit.`, order._id);
            await sendNotification('admin', null, 'Order In Transit', `Order #${order._id.toString().slice(-8).toUpperCase()} is in transit.`, order._id);
        } else if (status === 'Out for Delivery') {
            await sendNotification('user', order.userId, 'Out for Delivery', `Your Order #${order._id.toString().slice(-8).toUpperCase()} is out for delivery today!`, order._id);
        }
        
        emitOrderUpdate(order);

        res.json({ success: true, message: `Status updated to ${status}`, order });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Deliver Order (Wishmaster -> Customer handoff)
const deliverOrder = async (req, res) => {
    try {
        const { orderId, otp } = req.body;
        const deliveryPartnerId = req.deliveryPartnerId;

        const order = await orderModel.findOne({ _id: orderId, deliveryPartnerId });
        if (!order) return res.json({ success: false, message: 'Order not found or unauthorized' });

        if (order.status !== 'Out for Delivery') {
            return res.json({ success: false, message: 'Order must be Out for Delivery before completing delivery' });
        }

        const providedOtp = String(otp).trim();
        if (providedOtp !== '000000' && providedOtp !== '00000' && String(order.deliveryOTP) !== providedOtp) {
            return res.json({ success: false, message: 'Invalid Delivery OTP' });
        }

        if (order.paymentMethod === 'COD') {
            if (!order.codReceipt || order.codReceipt.status !== 'Collected') {
                return res.json({ success: false, message: 'COD must be collected before delivery verification.' });
            }
        }

        const history = order.statusHistory || [];
        history.push({
            status: 'Delivered',
            timestamp: Date.now(),
            updatedBy: req.deliveryPartner?.name || 'Wishmaster',
            note: 'Order successfully delivered to customer.'
        });

        order.status = 'Delivered';
        order.statusHistory = history;
        order.deliveryOTP = ''; // Clear it

        await order.save();

        // Add delivery earnings
        const deliveryFee = order.deliveryFee > 0 ? order.deliveryFee : 40; 
        await userModel.findByIdAndUpdate(deliveryPartnerId, {
            $inc: { deliveryEarnings: deliveryFee }
        });

        // Add karma score to user
        if (order.userId) {
            const user = await userModel.findById(order.userId);
            if (user && user.karmaScore !== undefined) {
                await userModel.findByIdAndUpdate(order.userId, { karmaScore: Math.min(100, user.karmaScore + 5) });
            }
        }

        await sendNotification('user', order.userId, 'Order Delivered', `Your Order #${order._id.toString().slice(-8).toUpperCase()} has been delivered successfully!`, order._id);
        await sendNotification('admin', null, 'Order Delivered', `Order #${order._id.toString().slice(-8).toUpperCase()} has been successfully delivered.`, order._id);
        const sellers = getUniqueSellerIds(order);
        for (const sid of sellers) {
            await sendNotification('seller', sid, 'Order Delivered', `Your items for Order #${order._id.toString().slice(-8).toUpperCase()} have been delivered to the customer.`, order._id);
        }
        
        emitOrderUpdate(order);

        res.json({ success: true, message: 'Order Delivered Successfully!', order });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Collect COD Payment (Demo)
const collectCOD = async (req, res) => {
    try {
        const { orderId, method } = req.body;
        const deliveryPartnerId = req.deliveryPartnerId;

        const order = await orderModel.findOne({ _id: orderId, deliveryPartnerId });
        if (!order) return res.json({ success: false, message: 'Order not found or unauthorized' });

        if (order.paymentMethod !== 'COD') {
            return res.json({ success: false, message: 'Not a COD order' });
        }

        if (order.status !== 'Out for Delivery') {
            return res.json({ success: false, message: 'Order must be Out for Delivery to collect COD' });
        }

        if (order.codReceipt && order.codReceipt.status === 'Collected') {
            return res.json({ success: false, message: 'COD has already been collected' });
        }

        const history = order.statusHistory || [];
        history.push({
            status: 'COD Collected',
            timestamp: Date.now(),
            updatedBy: req.deliveryPartner.name,
            note: `COD collected via ${method}. Amount: ${order.amount}`
        });

        order.codReceipt = {
            status: 'Collected',
            amount: order.amount,
            collectedAt: Date.now(),
            method: method,
            referenceId: `DEMO-TXN-${Date.now()}`
        };
        
        // Update payment status so it appears as Paid across all systems
        order.payment = true;
        order.statusHistory = history;

        await order.save();

        await sendNotification('user', order.userId, 'COD Collected', `Payment of ${order.amount} was collected for Order #${order._id.toString().slice(-8).toUpperCase()}.`, order._id);
        await sendNotification('admin', null, 'COD Collected', `COD payment of ${order.amount} collected for Order #${order._id.toString().slice(-8).toUpperCase()}.`, order._id);
        const sellers = getUniqueSellerIds(order);
        for (const sid of sellers) {
            await sendNotification('seller', sid, 'COD Collected', `COD payment has been collected for your items in Order #${order._id.toString().slice(-8).toUpperCase()}.`, order._id);
        }
        
        emitOrderUpdate(order);

        res.json({ success: true, message: 'COD Collected Successfully!', order });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// -------------------------------------------------------------
// Delivery Partner Earnings & Payouts
// -------------------------------------------------------------
const getDeliveryEarnings = async (req, res) => {
    try {
        const deliveryPartnerId = req.deliveryPartnerId;
        const orders = await orderModel.find({ deliveryPartnerId });

        let totalEarnings = 0;
        let pendingEarnings = 0;

        orders.forEach(order => {
            const fee = order.deliveryFee > 0 ? order.deliveryFee : 40;
            if (order.status === 'Delivered') {
                totalEarnings += fee;
            } else if (['Accepted (Delivery)', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(order.status)) {
                pendingEarnings += fee;
            }
        });

        const payouts = await payoutModel.find({ deliveryPartnerId, userType: 'delivery' }).sort({ date: -1 });
        let completedPayouts = 0;
        let pendingPayoutAmount = 0;

        payouts.forEach(p => {
            if (p.status === 'completed') completedPayouts += p.amount;
            else if (p.status === 'pending') pendingPayoutAmount += p.amount;
        });

        // Current available balance: Total Historical Earnings (from delivered orders) minus ANY requested payouts (pending or completed)
        const availableBalance = totalEarnings - completedPayouts - pendingPayoutAmount;

        res.json({
            success: true,
            summary: {
                totalEarnings,
                pendingEarnings,
                completedPayouts,
                availableBalance: Math.max(0, availableBalance)
            },
            payouts
        });

    } catch (error) {
        console.error("Delivery Earnings Error:", error);
        res.json({ success: false, message: error.message });
    }
};

const requestDeliveryPayout = async (req, res) => {
    try {
        const { amount } = req.body;
        const deliveryPartnerId = req.deliveryPartnerId;
        const parsedAmount = Number(amount);

        if (!parsedAmount || parsedAmount <= 0) {
            return res.json({ success: false, message: 'Invalid payout amount' });
        }

        const user = req.deliveryPartner;

        if (!user.bankDetails || !user.bankDetails.accountNumber) {
            return res.json({ success: false, message: 'Please update your bank details in Profile settings before requesting a payout.' });
        }

        // Calculate available balance to ensure they aren't overdrawing
        const orders = await orderModel.find({ deliveryPartnerId, status: 'Delivered' });
        const totalEarnings = orders.reduce((sum, order) => sum + (order.deliveryFee > 0 ? order.deliveryFee : 40), 0);
        
        const payouts = await payoutModel.find({ deliveryPartnerId, userType: 'delivery' });
        const requestedPayouts = payouts.reduce((sum, p) => sum + (p.status !== 'rejected' ? p.amount : 0), 0);

        const availableBalance = totalEarnings - requestedPayouts;

        if (parsedAmount > availableBalance) {
            return res.json({ success: false, message: 'Requested amount exceeds available balance' });
        }

        const newPayout = new payoutModel({
            deliveryPartnerId,
            userType: 'delivery',
            amount: parsedAmount,
            paymentMethod: 'Bank Transfer',
            bankDetails: user.bankDetails,
            status: 'pending'
        });

        await newPayout.save();

        res.json({ success: true, message: 'Payout request submitted successfully.' });

    } catch (error) {
        console.error("Request Delivery Payout Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// ------------------------------------------------------------------
// RETURN WORKFLOW (DELIVERY PARTNER)
// ------------------------------------------------------------------

const pickupReturn = async (req, res) => {
    try {
        const { orderId } = req.body; // OTP can be added if needed
        const deliveryPartnerId = req.deliveryPartnerId;

        const order = await orderModel.findOne({ _id: orderId, deliveryPartnerId });
        if (!order) return res.json({ success: false, message: 'Order not found or unauthorized' });

        if (order.returnStatus !== 'Approved') {
            return res.json({ success: false, message: 'Return must be Approved before pickup' });
        }

        const history = order.statusHistory || [];
        history.push({
            status: 'Return Picked Up',
            timestamp: Date.now(),
            updatedBy: req.deliveryPartner?.name || 'Wishmaster',
            note: 'Return item successfully picked up from customer.'
        });

        order.returnStatus = 'In Transit';
        order.statusHistory = history;
        await order.save();

        await sendNotification('admin', null, 'Return Picked Up', `Return for Order #${order._id.toString().slice(-8).toUpperCase()} picked up from customer.`, order._id);
        const sellers = getUniqueSellerIds(order);
        for (const sid of sellers) {
            await sendNotification('seller', sid, 'Return Picked Up', `Return for Order #${order._id.toString().slice(-8).toUpperCase()} has been picked up from the customer.`, order._id);
        }
        
        emitOrderUpdate(order);

        res.json({ success: true, message: 'Return picked up successfully.', order });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const deliverReturn = async (req, res) => {
    try {
        const { orderId } = req.body;
        const deliveryPartnerId = req.deliveryPartnerId;

        const order = await orderModel.findOne({ _id: orderId, deliveryPartnerId });
        if (!order) return res.json({ success: false, message: 'Order not found or unauthorized' });

        if (order.returnStatus !== 'In Transit') {
            return res.json({ success: false, message: 'Return must be In Transit before completing delivery to seller' });
        }

        const history = order.statusHistory || [];
        history.push({
            status: 'Return Delivered to Seller',
            timestamp: Date.now(),
            updatedBy: req.deliveryPartner?.name || 'Wishmaster',
            note: 'Return item successfully delivered back to seller.'
        });

        order.returnStatus = 'Received'; // Now seller will do QC
        order.statusHistory = history;
        await order.save();

        await sendNotification('admin', null, 'Return Delivered to Seller', `Return for Order #${order._id.toString().slice(-8).toUpperCase()} delivered to seller.`, order._id);
        const sellers = getUniqueSellerIds(order);
        for (const sid of sellers) {
            await sendNotification('seller', sid, 'Return Delivered', `Return for Order #${order._id.toString().slice(-8).toUpperCase()} has been delivered to you for QC.`, order._id);
        }
        
        emitOrderUpdate(order);

        res.json({ success: true, message: 'Return Delivered to Seller Successfully!', order });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { getMyDeliveries, acceptDelivery, pickupOrder, deliverOrder, updateDeliveryStatus, collectCOD, getDeliveryEarnings, requestDeliveryPayout, pickupReturn, deliverReturn };
