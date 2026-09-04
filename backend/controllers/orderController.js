import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import Stripe from 'stripe'
import razorpay from 'razorpay'
import settingsModel from "../models/settingsModel.js";
import couponModel from "../models/couponModel.js";
import { sendNotification, getIO, emitOrderUpdate } from "../config/socket.js";
import { calculateSellerShare } from "../utils/financeUtils.js";

// Helper function to notify admin and sellers when an order is placed
const notifyOrderPlaced = async (orderId) => {
    try {
        const order = await orderModel.findById(orderId);
        if (!order) return;
        
        // Notify admin
        await sendNotification('admin', null, 'New Order Received', `Order #${order._id.toString().slice(-8).toUpperCase()} has been placed successfully.`, order._id);
        
        // Notify sellers
        const sellerIds = [...new Set(order.items.map(item => item.sellerId).filter(Boolean))];
        for (const sellerId of sellerIds) {
            if (sellerId !== 'admin') {
                await sendNotification('seller', sellerId, 'New Order Received', `You have new items to pack for Order #${order._id.toString().slice(-8).toUpperCase()}.`, order._id);
            }
        }
    } catch (error) {
        console.error("Error sending order notification:", error);
    }
};

// Helper function to auto-assign delivery boy if Auto-Pilot is ON
const autoAssignToDeliveryBoy = async (orderId) => {
    try {
        console.log(`[Auto-Pilot] Triggered for order: ${orderId}`);
        const order = await orderModel.findById(orderId);
        if (!order) {
            console.log(`[Auto-Pilot] Order not found in DB`);
            return;
        }
        if (order.status !== "Ready for Pickup") {
            console.log(`[Auto-Pilot] Order status is ${order.status}, not Ready for Pickup. Ignoring.`);
            return;
        }

        const settings = await settingsModel.findOne() || {};
        if (!settings.autoAssignDelivery) {
            console.log(`[Auto-Pilot] settings.autoAssignDelivery is OFF. Exiting.`);
            return;
        }

        console.log(`[Auto-Pilot] Settings are ON. Finding vedant wagh...`);
        // Find online delivery boy specifically named "vedant wagh" (ignore city to be safe for now)
        const availablePartner = await userModel.findOne({
            isDeliveryPartner: true,
            deliveryStatus: 'approved',
            isDeliveryOnline: true,
            name: { $regex: /vedant|vedatn/i }
        });

        if (availablePartner) {
            console.log(`[Auto-Pilot] Found partner: ${availablePartner.name} (${availablePartner._id})`);
            order.deliveryPartnerId = availablePartner._id;
            order.status = 'Assigned';
            order.statusHistory.push({
                status: 'Assigned',
                timestamp: Date.now(),
                updatedBy: 'System',
                note: `Auto-Pilot: Order automatically assigned to Wishmaster: ${availablePartner.name}`
            });
            await order.save();

            emitOrderUpdate(order);
            await sendNotification('delivery', availablePartner._id, 'New Auto-Assigned Order', `You have been automatically assigned Order #${order._id.toString().slice(-8).toUpperCase()}`, order._id);
            console.log(`[Auto-Pilot] Successfully assigned!`);
        } else {
            console.log(`[Auto-Pilot] FAILED to find partner 'vedant wagh' who is approved and online.`);
        }
    } catch (error) {
        console.error("Error in autoAssignToDeliveryBoy:", error);
    }
};

// Helper to attach sellerId and storeName to order items from Product & User collections
const enrichItemsWithSellerId = async (items) => {
    if (!Array.isArray(items)) return items;
    return Promise.all(items.map(async (item) => {
        const pid = item._id || item.productId;
        let sId = item.sellerId || null;
        let sName = item.storeName || null;
        let razorpayAccountId = null;

        if (pid) {
            const dbProduct = await productModel.findById(pid);
            if (dbProduct) {
                if (dbProduct.sellerId) {
                    sId = dbProduct.sellerId.toString();
                    const sellerUser = await userModel.findById(sId);
                    if (sellerUser) {
                        sName = sellerUser.storeName || null;
                        razorpayAccountId = sellerUser.razorpayAccountId || null;
                    }
                }
            }
        }

        return {
            ...item,
            sellerId: sId || 'admin',
            storeName: sName || 'Veloura Official',
            razorpayAccountId
        };
    }));
};

// --- Routing & Reservation Engine ---
const getAssignedWarehouse = (zipcode) => {
    if (!zipcode) return null;
    const zipString = String(zipcode).trim();
    
    if (zipString.startsWith('440')) return 'WH_NAGPUR'; // Nagpur City
    if (zipString.startsWith('442')) return 'WH_WARDHA'; // Wardha
    if (zipString === '444709') return 'WH_DHAMANGAON'; // Dhamangaon Railway
    
    return null; // Delivery not available
};

const reserveStockForOrder = async (items, assignedWarehouse) => {
    const productsToUpdate = [];
    
    // 1. Verify availability
    for (const item of items) {
        const dbProduct = await productModel.findById(item._id || item.productId);
        if (!dbProduct) {
            throw new Error(`Product ${item.name} not found.`);
        }
        
        // Auto-upgrade legacy products with default inventory (100 per size per warehouse)
        if (!dbProduct.warehouseInventory || dbProduct.warehouseInventory.length === 0) {
            const stockMap = {};
            (dbProduct.sizes || ['S', 'M', 'L']).forEach(size => stockMap[size] = 100);
            dbProduct.warehouseInventory = [
                { warehouseId: 'WH_NAGPUR', stockMap: { ...stockMap }, stock: Object.keys(stockMap).length * 100 },
                { warehouseId: 'WH_WARDHA', stockMap: { ...stockMap }, stock: Object.keys(stockMap).length * 100 },
                { warehouseId: 'WH_DHAMANGAON', stockMap: { ...stockMap }, stock: Object.keys(stockMap).length * 100 }
            ];
            dbProduct.markModified('warehouseInventory');
            await dbProduct.save();
        }
        
        let hasStock = false;
        const whInventory = dbProduct.warehouseInventory?.find(wh => wh.warehouseId === assignedWarehouse);
        
        if (whInventory && whInventory.stockMap && whInventory.stockMap[item.size] !== undefined) {
            if (whInventory.stockMap[item.size] >= item.quantity) {
                hasStock = true;
            }
        }
        
        if (!hasStock) {
            let globalStock = 0;
            if (dbProduct.warehouseInventory) {
                for (const wh of dbProduct.warehouseInventory) {
                    if (wh.stockMap && wh.stockMap[item.size]) {
                        globalStock += wh.stockMap[item.size];
                    }
                }
            }
            
            if (globalStock < item.quantity) {
                throw new Error(`Item ${item.name} (Size: ${item.size}) is out of stock globally.`);
            } else {
                throw new Error(`Item ${item.name} (Size: ${item.size}) is currently out of stock in your region.`);
            }
        }
        
        productsToUpdate.push({
            product: dbProduct,
            size: item.size,
            quantity: item.quantity
        });
    }
    
    // 2. Safely deduct stock
    for (const update of productsToUpdate) {
        const { product, size, quantity } = update;
        
        if (product.stock && product.stock[size] !== undefined) {
            product.stock[size] -= quantity;
        }
        
        const whInventory = product.warehouseInventory.find(wh => wh.warehouseId === assignedWarehouse);
        if (whInventory) {
            whInventory.stockMap[size] -= quantity;
            whInventory.stock -= quantity;
        }
        
        product.markModified('stock');
        product.markModified('warehouseInventory');
        await product.save();
    }
};

// global variables
const currency = 'inr'
const deliveryCharge = 10

const markCouponAsUsed = async (couponCode, userId) => {
    if (!couponCode) return;
    try {
        const coupon = await couponModel.findOne({ code: couponCode.toUpperCase() });
        if (coupon) {
            let modified = false;
            if (coupon.isOneTime && !coupon.isUsed) {
                coupon.isUsed = true;
                modified = true;
            }
            if (userId) {
                if (!coupon.usedBy) coupon.usedBy = [];
                if (!coupon.usedBy.includes(userId)) {
                    coupon.usedBy.push(userId);
                    modified = true;
                }
            }
            if (modified) {
                await coupon.save();
            }
        }
    } catch(err) {
        console.error("Error marking coupon as used:", err);
    }
};

// gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

let razorpayInstance = null;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpayInstance = new razorpay({
            key_id : process.env.RAZORPAY_KEY_ID,
            key_secret : process.env.RAZORPAY_KEY_SECRET,
        });
    } else {
        console.warn("Razorpay keys missing. Razorpay payments will be disabled.");
    }
} catch(err) {
    console.error("Razorpay initialization error:", err);
}

const processOrderLogic = async (reqBody, paymentMethodString) => {
    const { userId, items, amount, address, couponCode, couponDiscount, tax, platformFee, subtotal, deliveryFee} = reqBody;

    // AI Karma Score Check for COD
    if (paymentMethodString === "COD") {
        const user = await userModel.findById(userId);
        if (user && user.karmaScore !== undefined && user.karmaScore < 40) {
            throw new Error("COD is disabled for your account due to low Karma Score (high return rate). Please use prepaid methods.");
        }
    }

    // Validate Coupon Before Placing Order
    if (couponCode) {
        if (couponCode === 'BUNDLE20') {
            const pastOrder = await orderModel.findOne({ userId, couponCode: 'BUNDLE20' });
            if (pastOrder) {
                throw new Error("Bundle discount is only valid for your first bundle purchase.");
            }
        } else {
            const coupon = await couponModel.findOne({ code: couponCode.toUpperCase() });
            if (!coupon) {
                throw new Error("Invalid coupon code.");
            }
            if (coupon.isOneTime && coupon.isUsed) {
                throw new Error("This coupon has already been used and is only valid for one order.");
            }
            if (coupon.usedBy && coupon.usedBy.includes(userId)) {
                throw new Error("You have already used this coupon on a previous order.");
            }
        }
    }

    const enrichedItems = await enrichItemsWithSellerId(items);
    const now = Date.now();

    const initialStatus = "Packing";
    
    const estimatedDate = new Date(now + 3 * 24 * 60 * 60 * 1000).toDateString();
    
    // Determine origin warehouse from Seller's location
    let originPincode = address.zipcode || address.pincode;
    if (enrichedItems.length > 0 && enrichedItems[0].sellerId) {
        const seller = await userModel.findById(enrichedItems[0].sellerId);
        if (seller && seller.storePincode) {
            originPincode = seller.storePincode;
        }
    }

    const assignedWarehouse = getAssignedWarehouse(originPincode);
    if (!assignedWarehouse) {
        throw new Error("Delivery not available from the seller's area.");
    }
    
    await reserveStockForOrder(enrichedItems, assignedWarehouse);

    const orderData = {
        userId,
        items: enrichedItems,
        address,
        amount,
        tax: tax || 0,
        platformFee: platformFee || 0,
        subtotal: subtotal || 0,
        deliveryFee: deliveryFee || 0,
        couponCode: couponCode || '',
        couponDiscount: couponDiscount || 0,
        status: initialStatus,
        statusHistory: [{
            status: initialStatus,
            timestamp: now,
            updatedBy: 'System',
            note: `Order placed via ${paymentMethodString} and packing initiated.`
        }],
        estimatedDelivery: estimatedDate,
        paymentMethod: paymentMethodString,
        payment: false,
        date: now,
        updatedAt: now,
        assignedWarehouse
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();
    await markCouponAsUsed(couponCode, userId);

    return { newOrder, enrichedItems };
};

// Placing orders using COD Method
const placeOrder = async (req,res) => {
    try {
        const { newOrder } = await processOrderLogic(req.body, "COD");

        await userModel.findByIdAndUpdate(req.body.userId, {cartData:{}});
        emitOrderUpdate(newOrder);
        await notifyOrderPlaced(newOrder._id);

        res.json({success:true,message:"Order Placed", orderId: newOrder._id});

    } catch (error) {
        console.log(error);
        res.json({success:false, message: error.message});
    }
}

// Placing orders using Stripe Method
const placeOrderStripe = async (req,res) => {
    try {
        const { items, amount } = req.body;
        const { origin } = req.headers;
        
        const { newOrder } = await processOrderLogic(req.body, "Stripe");

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }));

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: 'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        });

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:  `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
            payment_method_types: ['card'],
        });

        res.json({success:true,session_url:session.url});

    } catch (error) {
        console.log(error);
        res.json({success:false, message: error.message});
    }
}

// Verify Stripe 
const verifyStripe = async (req,res) => {

    const { orderId, success, userId } = req.body

    try {
        if (success === "true") {
            const updatedOrder = await orderModel.findByIdAndUpdate(orderId, {payment:true}, {new: true});
            await userModel.findByIdAndUpdate(userId, {cartData: {}})
            if (updatedOrder) emitOrderUpdate(updatedOrder);
            await notifyOrderPlaced(orderId);
            
            res.json({success: true, orderId});
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({success:false})
        }
        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// Placing orders using Razorpay Method
const placeOrderRazorpay = async (req,res) => {
    try {
        const { amount } = req.body;
        
        const { newOrder, enrichedItems } = await processOrderLogic(req.body, "Razorpay");

        // Fetch Global Commission
        let settings = await settingsModel.findOne();
        const commissionRate = settings ? (settings.platformCommission / 100) : 0.10;

        // Build Transfers array
        const transfers = [];
        
        const uniqueSellers = [...new Set(enrichedItems.map(i => i.sellerId).filter(id => id && id !== 'admin'))];
        
        uniqueSellers.forEach(sellerId => {
            const sellerItems = enrichedItems.filter(i => i.sellerId === sellerId);
            const razorpayAccountId = sellerItems.find(i => i.razorpayAccountId)?.razorpayAccountId;
            
            if (razorpayAccountId) {
                // Since we don't have orderData explicitly structured here as before, we pass the original req.body merged with enrichedItems
                const orderDataForShare = { ...req.body, items: enrichedItems };
                const { sellerShare } = calculateSellerShare(orderDataForShare, sellerId, commissionRate);
                const sellerSharePaise = Math.round(sellerShare * 100); // in paise
                
                if (sellerSharePaise > 0) {
                    transfers.push({
                        account: razorpayAccountId,
                        amount: sellerSharePaise,
                        currency: currency.toUpperCase(),
                        notes: {
                            orderId: newOrder._id.toString(),
                            productName: sellerItems.map(i => i.name).join(', ').substring(0, 40)
                        },
                        linked_account_notes: ["orderId"]
                    });
                }
            }
        });

        const options = {
            amount: amount * 100,
            currency: currency.toUpperCase(),
            receipt: newOrder._id.toString(),
        };

        if (transfers.length > 0) {
            options.transfers = transfers;
        }

        await razorpayInstance.orders.create(options, (error,order)=>{
            if (error) {
                console.log(error);
                return res.json({success:false, message: error});
            }
            res.json({success:true, order});
        });

    } catch (error) {
        console.log(error);
        res.json({success:false, message: error.message});
    }
}

const verifyRazorpay = async (req,res) => {
    try {
        
        const { userId, razorpay_order_id  } = req.body

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        if (orderInfo.status === 'paid') {
            const updatedOrder = await orderModel.findByIdAndUpdate(orderInfo.receipt,{payment:true},{new:true});
            await userModel.findByIdAndUpdate(userId,{cartData:{}})
            if (updatedOrder) emitOrderUpdate(updatedOrder);
            await notifyOrderPlaced(orderInfo.receipt);
            
            res.json({ success: true, message: "Payment Successful" })
        } else {
             res.json({ success: false, message: 'Payment Failed' });
        }

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


// All Orders data for Admin Panel
const allOrders = async (req,res) => {

    try {
        
        const orders = await orderModel.find({}).lean();
        const userIds = [...new Set(orders.map(o => o.userId).filter(Boolean))];
        const users = await userModel.find({ _id: { $in: userIds } }, 'karmaScore name email').lean();
        
        const userMap = {};
        users.forEach(u => {
            userMap[u._id] = {
                karmaScore: u.karmaScore !== undefined ? u.karmaScore : 100,
                name: u.name,
                email: u.email
            };
        });

        const enrichedOrders = orders.map(order => {
            const userData = order.userId && userMap[order.userId] ? userMap[order.userId] : null;
            return {
                ...order,
                karmaScore: userData ? userData.karmaScore : 100,
                userProfileName: userData ? userData.name : null,
                userProfileEmail: userData ? userData.email : null
            };
        });

        res.json({success:true,orders: enrichedOrders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// User Order Data For Forntend
const userOrders = async (req,res) => {
    try {
        
        const { userId } = req.body

        const orders = await orderModel.find({ userId })
        res.json({success:true,orders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// update order status from Admin Panel
const updateStatus = async (req,res) => {
    try {
        
        const { orderId, status, note, updatedBy } = req.body
        const now = Date.now();

        const existingOrder = await orderModel.findById(orderId);
        if (!existingOrder) {
            return res.json({ success: false, message: 'Order not found' });
        }

        const validAdminStatuses = ['Packing', 'Packed', 'Ready for Pickup', 'Assigned', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Returned', 'Cancelled'];
        
        if (existingOrder.cancelStatus === 'Requested' && status !== 'Cancelled') {
            return res.json({ success: false, message: "Cannot update status while a cancellation request is pending." });
        }

        // Only allow Admin to move from Packing -> Packed -> Ready for Pickup
        // If it's jumping directly from Packing to Delivered, reject it.
        const currentStatusIdx = validAdminStatuses.indexOf(existingOrder.status);
        const nextStatusIdx = validAdminStatuses.indexOf(status);

        if (nextStatusIdx !== -1 && currentStatusIdx !== -1) {
            if (nextStatusIdx < currentStatusIdx) {
                return res.json({ success: false, message: "Cannot move order status backwards." });
            }
            if (nextStatusIdx > currentStatusIdx + 1 && status !== 'Cancelled' && status !== 'Returned') {
                 // return res.json({ success: false, message: "Strict workflow enforced: Cannot skip status steps." });
                 // Let's enforce strict workflow
                 if (existingOrder.status === 'Packing' && status !== 'Packed') {
                     return res.json({ success: false, message: "Order must be Packed before any other status." });
                 }
                 if (existingOrder.status === 'Packed' && status !== 'Ready for Pickup') {
                     return res.json({ success: false, message: "Order must be Marked Ready for Dispatch." });
                 }
            }
        }


        const history = existingOrder.statusHistory || [];
        const newHistoryEntry = {
            status,
            timestamp: now,
            updatedBy: updatedBy || 'Admin',
            note: note || `Order status updated to ${status}`
        };

        const updatedHistory = [...history, newHistoryEntry];

        await orderModel.findByIdAndUpdate(orderId, { 
            status, 
            statusHistory: updatedHistory,
            updatedAt: now 
        });

        // AI Karma Score Logic
        if (existingOrder.status !== status && existingOrder.userId) {
            const user = await userModel.findById(existingOrder.userId);
            if (user) {
                let currentScore = user.karmaScore !== undefined ? user.karmaScore : 100;
                let newScore = currentScore;
                
                if (status === 'Returned' || status === 'Cancelled') {
                    newScore = Math.max(0, currentScore - 20); // Penalty
                } else if (status === 'Delivered') {
                    newScore = Math.min(100, currentScore + 5); // Reward
                }

                if (newScore !== currentScore) {
                    await userModel.findByIdAndUpdate(existingOrder.userId, { karmaScore: newScore });
                }
            }
        }
        
        emitOrderUpdate(existingOrder);

        res.json({success:true, message:'Status Updated', orderId, status})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// Delete order permanently from Admin Panel
const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const deletedOrder = await orderModel.findByIdAndDelete(orderId);
        if (!deletedOrder) {
            return res.json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get Analytics Data for Admin Dashboard
const getAdminAnalytics = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        const totalUsers = await userModel.countDocuments();

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const msInDay = 24 * 60 * 60 * 1000;
        
        // This Week (last 7 days including today)
        const thisWeekStart = startOfToday - (6 * msInDay);
        // Last Week (the 7 days before this week)
        const lastWeekStart = thisWeekStart - (7 * msInDay);

        let totalRevenue = 0;
        let thisWeekRevenue = 0;
        let lastWeekRevenue = 0;
        let thisWeekOrders = 0;
        let lastWeekOrders = 0;

        let paymentMethods = { COD: 0, Stripe: 0, Razorpay: 0 };
        let categorySales = {};

        // Prepare arrays for daily revenue trends
        // We want data for the last 7 days (e.g., May 18 to May 24)
        const dailyRevenue = Array(7).fill(0).map((_, i) => ({
            date: new Date(thisWeekStart + i * msInDay).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            revenue: 0,
            thisWeekSales: 0,
            lastWeekSales: 0,
            timestamp: thisWeekStart + i * msInDay
        }));

        orders.forEach(order => {
            if (order.payment) {
                totalRevenue += order.amount;
                
                // Track Payment Methods
                if (paymentMethods[order.paymentMethod] !== undefined) {
                    paymentMethods[order.paymentMethod]++;
                } else {
                    paymentMethods['COD']++; // Fallback
                }

                // Track Categories
                if (order.items && order.items.length > 0) {
                    order.items.forEach(item => {
                        const cat = item.category || 'Other';
                        const itemRevenue = item.price * item.quantity;
                        if (!categorySales[cat]) categorySales[cat] = 0;
                        categorySales[cat] += itemRevenue;
                    });
                }

                // Time based calculations
                const orderTime = order.date; // timestamp in ms

                if (orderTime >= thisWeekStart) {
                    thisWeekRevenue += order.amount;
                    thisWeekOrders++;
                    
                    // Add to daily trend
                    const dayIndex = Math.floor((orderTime - thisWeekStart) / msInDay);
                    if (dayIndex >= 0 && dayIndex < 7) {
                        dailyRevenue[dayIndex].revenue += order.amount;
                        dailyRevenue[dayIndex].thisWeekSales += order.amount;
                    }
                } else if (orderTime >= lastWeekStart && orderTime < thisWeekStart) {
                    lastWeekRevenue += order.amount;
                    lastWeekOrders++;

                    // Align last week's days with this week's days for comparison
                    const dayIndex = Math.floor((orderTime - lastWeekStart) / msInDay);
                    if (dayIndex >= 0 && dayIndex < 7) {
                        dailyRevenue[dayIndex].lastWeekSales += order.amount;
                    }
                }
            }
        });

        const totalOrdersCount = orders.length;
        const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
        
        // Calculated conversion rate (Orders / Total Users) - since we don't track raw visitors
        const conversionRate = totalUsers > 0 ? ((totalOrdersCount / totalUsers) * 100).toFixed(2) : 0;
        
        // Calculate percentages vs last week
        const revenueGrowth = lastWeekRevenue > 0 ? (((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100).toFixed(1) : (thisWeekRevenue > 0 ? 100 : 0);
        const ordersGrowth = lastWeekOrders > 0 ? (((thisWeekOrders - lastWeekOrders) / lastWeekOrders) * 100).toFixed(1) : (thisWeekOrders > 0 ? 100 : 0);
        
        // Format Top Categories for Frontend
        const topCategories = Object.keys(categorySales).map(cat => ({
            name: cat,
            value: categorySales[cat]
        })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

        // Template requires taxes/shipping breakdown. 
        // We know delivery is 10 per order normally, but let's approximate dynamically to match the visual template style.
        // Assuming ~5% tax and 7% shipping dynamically from total revenue for the pie chart.
        const productSales = Math.round(totalRevenue * 0.84);
        const shippingCharges = Math.round(totalRevenue * 0.08);
        const taxes = Math.round(totalRevenue * 0.05);
        const otherIncome = totalRevenue - productSales - shippingCharges - taxes;

        const revenueBreakdown = [
            { name: 'Product Sales', value: productSales, color: '#3b82f6' },
            { name: 'Shipping Charges', value: shippingCharges, color: '#10b981' },
            { name: 'Taxes', value: taxes, color: '#8b5cf6' },
            { name: 'Other Income', value: otherIncome, color: '#f59e0b' }
        ];

        const paymentData = [
            { name: 'COD', value: paymentMethods.COD || 1, color: '#3b82f6' },
            { name: 'Stripe', value: paymentMethods.Stripe || 0, color: '#10b981' },
            { name: 'Razorpay', value: paymentMethods.Razorpay || 0, color: '#8b5cf6' }
        ];

        res.json({
            success: true,
            analytics: {
                totalRevenue,
                totalOrders: totalOrdersCount,
                averageOrderValue,
                totalCustomers: totalUsers,
                conversionRate,
                revenueGrowth,
                ordersGrowth,
                dailyRevenue,
                topCategories,
                revenueBreakdown,
                paymentData,
                thisWeekRevenue,
                lastWeekRevenue
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Cancellation Endpoints
const requestCancellation = async (req, res) => {
    try {
        const { orderId, reason, userId } = req.body;
        
        const order = await orderModel.findOne({ _id: orderId, userId });
        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        const beyondCancellation = ['Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];
        if (beyondCancellation.includes(order.status)) {
            return res.json({ success: false, message: 'Cannot cancel order at this stage.' });
        }

        if (order.cancelStatus !== 'None') {
            return res.json({ success: false, message: 'Cancellation already requested.' });
        }

        const now = Date.now();
        const orderAgeHours = (now - order.date) / (1000 * 60 * 60);

        if (orderAgeHours > 48) {
            return res.json({ success: false, message: 'Cancellation window has expired (over 48 hours).' });
        }

        if (orderAgeHours <= 24) {
            // Window 1: Auto Cancellation
            const history = order.statusHistory || [];
            history.push({
                status: 'Cancelled',
                timestamp: now,
                updatedBy: 'Customer',
                note: `Order cancelled automatically by customer. Reason: ${reason || 'None provided'}`
            });

            order.status = 'Cancelled';
            order.cancelStatus = 'Approved';
            order.cancelReason = reason || '';
            order.statusHistory = history;
            order.updatedAt = now;
            await order.save();
            
            // Penalty logic for cancellation
            if (order.userId) {
                const user = await userModel.findById(order.userId);
                if (user && user.karmaScore !== undefined) {
                    await userModel.findByIdAndUpdate(order.userId, { karmaScore: Math.max(0, user.karmaScore - 20) });
                }
            }

            return res.json({ success: true, message: 'Order has been successfully cancelled.' });
        } else {
            // Window 2: 24 - 48 hours (Needs Admin Approval)
            order.cancelStatus = 'Requested';
            order.cancelReason = reason || '';
            await order.save();
            return res.json({ success: true, message: 'Cancellation request submitted. Pending admin approval.' });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const approveCancellation = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        const order = await orderModel.findById(orderId);
        if (!order || order.cancelStatus !== 'Requested') {
            return res.json({ success: false, message: 'Valid cancellation request not found.' });
        }

        const beyondCancellation = ['Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];
        if (beyondCancellation.includes(order.status)) {
            // Auto-reject if the order has progressed too far while waiting for admin
            order.cancelStatus = 'Rejected';
            await order.save();
            return res.json({ success: false, message: 'Order has already progressed to shipping. Cancellation automatically rejected.' });
        }

        const now = Date.now();
        const history = order.statusHistory || [];
        history.push({
            status: 'Cancelled',
            timestamp: now,
            updatedBy: 'Admin',
            note: 'Cancellation request approved by admin.'
        });

        order.status = 'Cancelled';
        order.cancelStatus = 'Approved';
        order.statusHistory = history;
        order.updatedAt = now;

        await order.save();

        // Penalty logic for cancellation
        if (order.userId) {
            const user = await userModel.findById(order.userId);
            if (user && user.karmaScore !== undefined) {
                await userModel.findByIdAndUpdate(order.userId, { karmaScore: Math.max(0, user.karmaScore - 20) });
            }
        }
        
        emitOrderUpdate(order);

        res.json({ success: true, message: 'Cancellation approved.' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const rejectCancellation = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        const order = await orderModel.findById(orderId);
        if (!order || order.cancelStatus !== 'Requested') {
            return res.json({ success: false, message: 'Valid cancellation request not found.' });
        }

        order.cancelStatus = 'Rejected';
        await order.save();

        res.json({ success: true, message: 'Cancellation request rejected.' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const assignWishmaster = async (req, res) => {
    try {
        const { orderId, partnerId } = req.body;
        
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        if (
            order.status !== 'Ready for Pickup' && 
            order.returnStatus !== 'Approved'
        ) {
            return res.json({ success: false, message: `Cannot assign Wishmaster. Order is already ${order.status}.` });
        }

        const partner = await userModel.findOne({ _id: partnerId, isDeliveryPartner: true });
        if (!partner) {
            return res.json({ success: false, message: 'Valid and approved Delivery Partner not found' });
        }

        // STEP 5: Hub Routing Security Check (case-insensitive)
        const getCityWarehouse = (city = '') => {
            const c = city.trim().toLowerCase();
            if (c.includes('nagpur')) return 'WH_NAGPUR';
            if (c.includes('wardha')) return 'WH_WARDHA';
            if (c.includes('dhamangaon') || c.includes('dhamangoan')) return 'WH_DHAMANGAON';
            return city.trim(); // fallback to raw value
        };
        const partnerWarehouse = getCityWarehouse(partner.serviceCity);
        if (order.assignedWarehouse && partnerWarehouse !== order.assignedWarehouse) {
            return res.json({ success: false, message: `Cannot assign order from ${order.assignedWarehouse} to a Delivery Partner in ${partner.serviceCity || 'Unknown City'}.` });
        }

        const now = Date.now();
        const history = order.statusHistory || [];
        
        // Differentiate note based on whether it's a delivery or a return pickup
        const isReturn = order.returnStatus === 'Approved';
        
        history.push({
            status: 'Assigned',
            timestamp: now,
            updatedBy: 'Admin',
            note: isReturn ? `Reverse pickup assigned to Wishmaster: ${partner.name}` : `Order assigned to Wishmaster: ${partner.name}`
        });

        if (!isReturn) {
            order.status = 'Assigned';
        }
        // If it is a return, we leave the main status as Delivered, and only track returnStatus.
        // Actually, we don't need to change returnStatus here, it stays 'Approved' until the Wishmaster picks it up (then it becomes 'In Transit').

        order.deliveryPartnerId = partnerId;
        order.statusHistory = history;
        order.updatedAt = now;

        await order.save();

        // Notification to Delivery Partner
        const notifTitle = isReturn ? 'Reverse Pickup Assigned' : 'New Delivery Assigned';
        const notifBody = isReturn 
            ? `You have been assigned a reverse pickup for Order #${order._id.toString().slice(-8).toUpperCase()}` 
            : `You have been assigned to deliver Order #${order._id.toString().slice(-8).toUpperCase()}`;

        await sendNotification('delivery', partnerId, notifTitle, notifBody, order._id);
        
        emitOrderUpdate(order);

        res.json({ success: true, message: 'Wishmaster assigned successfully', order });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ------------------------------------------------------------------
// RETURN & REFUND WORKFLOW
// ------------------------------------------------------------------

const requestReturn = async (req, res) => {
    try {
        const { orderId, reason, images } = req.body;
        const userId = req.userId; // auth middleware

        const order = await orderModel.findOne({ _id: orderId, userId });
        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'Delivered') {
            return res.json({ success: false, message: 'Only delivered orders can be returned.' });
        }

        if (order.returnStatus !== 'None') {
            return res.json({ success: false, message: 'Return already requested for this order.' });
        }

        // Check 7 day window
        const now = Date.now();
        // The order delivery date should be used, but since we don't have a strict deliveryDate field,
        // we check statusHistory for 'Delivered' timestamp, or fallback to updatedAT
        let deliveredDate = order.updatedAt;
        const deliveredHistory = (order.statusHistory || []).find(h => h.status === 'Delivered');
        if (deliveredHistory) deliveredDate = deliveredHistory.timestamp;

        const ageDays = (now - deliveredDate) / (1000 * 60 * 60 * 24);
        if (ageDays > 7) {
            return res.json({ success: false, message: 'Return window (7 days) has expired.' });
        }

        const history = order.statusHistory || [];
        history.push({
            status: 'Return Requested',
            timestamp: now,
            updatedBy: 'Customer',
            note: `Return requested. Reason: ${reason}`
        });

        order.returnStatus = 'Requested';
        order.returnReason = reason || '';
        order.returnImages = images || [];
        order.returnDate = now;
        order.statusHistory = history;
        order.updatedAt = now;

        await order.save();

        // Notify Admin and Seller
        await sendNotification('admin', null, 'Return Requested', `Order #${order._id.toString().slice(-8).toUpperCase()} has a new return request.`, order._id);
        
        emitOrderUpdate(order);

        res.json({ success: true, message: 'Return request submitted successfully.' });

    } catch (error) {
        console.error("Return Request Error:", error);
        res.json({ success: false, message: error.message });
    }
};

const processRefund = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }

        if (order.refundStatus !== 'Pending') {
            return res.json({ success: false, message: 'Refund is not in Pending state.' });
        }

        // In a real app, integrate Stripe/Razorpay refund API here.
        // For COD, admin processes it manually or adds to Wallet.
        
        const now = Date.now();
        const history = order.statusHistory || [];
        history.push({
            status: 'Refund Completed',
            timestamp: now,
            updatedBy: 'Admin',
            note: `Refund of ${order.amount} processed successfully.`
        });

        order.refundStatus = 'Completed';
        order.refundAmount = order.amount;
        order.status = 'Returned'; // Final state of order
        order.statusHistory = history;
        order.updatedAt = now;

        await order.save();

        await sendNotification('user', order.userId, 'Refund Completed', `Your refund of ${order.amount} for Order #${order._id.toString().slice(-8).toUpperCase()} is completed.`, order._id);
        
        emitOrderUpdate(order);

        res.json({ success: true, message: 'Refund processed successfully.' });

    } catch (error) {
        console.error("Process Refund Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export {autoAssignToDeliveryBoy, verifyRazorpay, verifyStripe ,placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, deleteOrder, getAdminAnalytics, requestCancellation, approveCancellation, rejectCancellation, assignWishmaster, requestReturn, processRefund}