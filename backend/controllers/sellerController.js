import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import reviewModel from "../models/reviewModel.js";
import payoutModel from "../models/payoutModel.js";

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
};

// 1. Seller Registration
const registerSeller = async (req, res) => {
    try {
        const { name, email, password, storeName, storePhone, storeDescription } = req.body;

        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists with this email" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email address" });
        }
        if (!password || password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" });
        }
        if (!storeName || storeName.trim() === '') {
            return res.json({ success: false, message: "Store name is required" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newSeller = new userModel({
            name,
            email,
            password: hashedPassword,
            role: 'seller',
            isSeller: true,
            sellerStatus: 'pending',
            storeName: storeName.trim(),
            storePhone: storePhone || '',
            storeDescription: storeDescription || ''
        });

        const user = await newSeller.save();
        const token = createToken(user._id);

        res.json({
            success: true,
            token,
            sellerStatus: 'pending',
            message: "Seller registration submitted! Awaiting admin approval."
        });

    } catch (error) {
        console.error("Seller Register Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// 1.5 Seller Application (From Existing User Account)
const applyForSeller = async (req, res) => {
    try {
        // req.body.userId comes from authUser middleware
        const { userId, storeName, storePhone, storeDescription, bankDetails } = req.body;
        
        if (!storeName || storeName.trim() === '') {
            return res.json({ success: false, message: "Store name is required" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (user.sellerStatus === 'pending' || user.sellerStatus === 'approved') {
            return res.json({ success: false, message: "You have already applied to become a seller" });
        }

        user.isSeller = true;
        user.role = 'seller'; // Give them the role so sellerAuth works
        user.sellerStatus = 'pending';
        user.storeName = storeName.trim();
        user.storePhone = storePhone || '';
        user.storeDescription = storeDescription || '';
        
        if (bankDetails) {
            user.bankDetails = bankDetails;
        }
        user.sellerRejectionReason = '';

        await user.save();

        res.json({
            success: true,
            sellerStatus: 'pending',
            message: "Seller application submitted successfully! Awaiting admin approval."
        });

    } catch (error) {
        console.error("Seller Application Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// 2. Seller Login
const loginSeller = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "Seller account does not exist" });
        }

        if (!user.isSeller && user.role !== 'seller') {
            return res.json({ success: false, message: "This email is not registered as a seller account" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid email or password" });
        }

        const token = createToken(user._id);

        res.json({
            success: true,
            token,
            sellerStatus: user.sellerStatus,
            sellerRejectionReason: user.sellerRejectionReason || '',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                storeName: user.storeName,
                storeLogo: user.storeLogo,
                sellerStatus: user.sellerStatus
            }
        });

    } catch (error) {
        console.error("Seller Login Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// 3. Get Seller Status (for status checks & pending page polling)
const getSellerStatus = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({ success: false, message: 'Not Authorized' });
        }
        const token = authHeader.split(' ')[1];
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(token_decode.id);

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            sellerStatus: user.sellerStatus,
            sellerRejectionReason: user.sellerRejectionReason || '',
            storeName: user.storeName,
            storeLogo: user.storeLogo,
            email: user.email,
            name: user.name
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 4. Store Profile Management
const getSellerProfile = async (req, res) => {
    try {
        const seller = await userModel.findById(req.sellerId).select('-password');
        res.json({ success: true, profile: seller });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const updateSellerProfile = async (req, res) => {
    try {
        const { storeName, storePhone, storeDescription, storeLogo, bankDetails, name } = req.body;

        const updateData = {};
        if (storeName) updateData.storeName = storeName;
        if (storePhone !== undefined) updateData.storePhone = storePhone;
        if (storeDescription !== undefined) updateData.storeDescription = storeDescription;
        if (storeLogo !== undefined) updateData.storeLogo = storeLogo;
        if (name) updateData.name = name;
        if (bankDetails) updateData.bankDetails = bankDetails;

        const updatedUser = await userModel.findByIdAndUpdate(req.sellerId, updateData, { new: true }).select('-password');

        res.json({ success: true, message: "Profile updated successfully", profile: updatedUser });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 5. Dashboard Overview Stats
const getDashboardOverview = async (req, res) => {
    try {
        const sellerId = req.sellerId;

        // Products stats
        const sellerProducts = await productModel.find({ sellerId });
        const totalProducts = sellerProducts.length;
        const activeProducts = sellerProducts.filter(p => p.approvalStatus === 'approved').length;

        // All orders containing seller products
        const allOrders = await orderModel.find({ "items.sellerId": sellerId });
        
        let pendingOrders = 0;
        let totalEarnings = 0;

        const sellerRecentOrders = [];
        
        // Data for Analytics Charts
        const statusDistribution = {
            'Packing': 0,
            'Shipped': 0,
            'Out for Delivery': 0,
            'Delivered': 0,
            'Cancelled': 0
        };

        const salesByDate = {};
        const uniqueCustomers = new Set();
        const productSales = {};
        const salesByCategory = {};

        allOrders.forEach(order => {
            const sellerItems = order.items.filter(i => i.sellerId === sellerId || (!i.sellerId && sellerId === null));
            if (sellerItems.length > 0) {
                const itemTotal = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                
                if (order.userId) uniqueCustomers.add(order.userId.toString());

                if (order.status !== 'Delivered' && order.status !== 'Cancelled') {
                    pendingOrders += 1;
                }
                if (order.status === 'Delivered') {
                    totalEarnings += (itemTotal * 0.90); // 10% platform fee deducted
                }

                // Populate status distribution
                if (statusDistribution[order.status] !== undefined) {
                    statusDistribution[order.status] += 1;
                }

                // Populate sales trend
                if (order.status === 'Delivered') {
                    const dateObj = new Date(order.date);
                    const dateStr = dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                    if (!salesByDate[dateStr]) {
                        salesByDate[dateStr] = 0;
                    }
                    salesByDate[dateStr] += itemTotal;
                }

                // Populate Top Products & Category Data
                sellerItems.forEach(item => {
                    const rev = item.price * item.quantity;
                    const cat = item.category || 'Other';
                    
                    if (order.status === 'Delivered') {
                        if (!salesByCategory[cat]) salesByCategory[cat] = 0;
                        salesByCategory[cat] += rev;
                    }

                    if (!productSales[item._id || item.name]) {
                        productSales[item._id || item.name] = {
                            name: item.name,
                            image: item.image?.[0] || item.image || '',
                            unitsSold: 0,
                            revenue: 0
                        };
                    }
                    productSales[item._id || item.name].unitsSold += item.quantity;
                    if (order.status === 'Delivered') {
                        productSales[item._id || item.name].revenue += rev;
                    }
                });

                sellerRecentOrders.push({
                    _id: order._id,
                    orderId: order._id.toString().slice(-6).toUpperCase(),
                    date: order.date,
                    customerName: order.address?.firstName ? `${order.address.firstName} ${order.address.lastName || ''}` : 'Customer',
                    itemsCount: sellerItems.reduce((acc, i) => acc + i.quantity, 0),
                    items: sellerItems,
                    amount: itemTotal,
                    status: order.status,
                    paymentMethod: order.paymentMethod,
                    payment: order.payment
                });
            }
        });

        // Convert salesByDate to array and sort chronologically
        const salesTrend = Object.keys(salesByDate).map(date => ({
            name: date,
            revenue: salesByDate[date],
            timestamp: new Date(`${date}, ${new Date().getFullYear()}`).getTime()
        })).sort((a, b) => a.timestamp - b.timestamp).map(item => ({ name: item.name, revenue: item.revenue }));


        // Sort by date desc and take top 5
        sellerRecentOrders.sort((a, b) => b.date - a.date);
        const recentOrders = sellerRecentOrders.slice(0, 5);

        // Sort products for top selling
        const topProductsList = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map((p, index) => ({ id: index + 1, name: p.name, img: p.image, sold: p.unitsSold, rev: p.revenue }));

        // Format salesByCategory for donut chart
        const categoryDataList = Object.keys(salesByCategory).map(cat => ({
            name: cat,
            value: salesByCategory[cat]
        })).sort((a, b) => b.value - a.value);

        res.json({
            success: true,
            summary: {
                totalProducts,
                activeProducts,
                pendingOrders,
                totalSales: totalEarnings,
                totalCustomers: uniqueCustomers.size,
                totalOrdersCount: allOrders.length
            },
            recentOrders,
            topProducts: topProductsList,
            categoryData: categoryDataList,
            charts: {
                salesTrend,
                statusDistribution
            }
        });

    } catch (error) {
        console.error("Dashboard Overview Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// 6. Seller Products CRUD
const getSellerProducts = async (req, res) => {
    try {
        const products = await productModel.find({ sellerId: req.sellerId }).sort({ date: -1 });
        res.json({ success: true, products });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const addSellerProduct = async (req, res) => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_SECRET_KEY
        });

        const {
            name, description, price, discount, category, subCategory,
            sizes, colors, material, bestseller, returnAvailable, cashOnDelivery, stock
        } = req.body;

        const image1 = req.files?.image1?.[0];
        const image2 = req.files?.image2?.[0];
        const image3 = req.files?.image3?.[0];
        const image4 = req.files?.image4?.[0];

        const images = [image1, image2, image3, image4].filter(item => item !== undefined);

        let imagesUrl = [];
        if (images.length > 0) {
            imagesUrl = await Promise.all(
                images.map(async (item) => {
                    let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                    return result.secure_url;
                })
            );
        }

        let parsedStock = {};
        if (stock) {
            try {
                parsedStock = typeof stock === 'string' ? JSON.parse(stock) : stock;
            } catch (e) {
                parsedStock = {};
            }
        }

        let parsedSizes = [];
        if (sizes) {
            try {
                parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
            } catch (e) {
                parsedSizes = [];
            }
        }

        let parsedColors = [];
        if (colors) {
            try {
                parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
            } catch (e) {
                parsedColors = [];
            }
        }

        const productData = {
            name,
            description,
            price: Number(price),
            discount: discount ? Number(discount) : 0,
            category,
            subCategory,
            sizes: parsedSizes,
            colors: parsedColors,
            material: material || '',
            bestseller: bestseller === "true" || bestseller === true,
            returnAvailable: returnAvailable === "true" || returnAvailable === true,
            cashOnDelivery: cashOnDelivery === "true" || cashOnDelivery === true,
            stock: parsedStock,
            image: imagesUrl,
            sellerId: req.sellerId,
            approvalStatus: 'pending',
            date: Date.now()
        };

        const product = new productModel(productData);
        await product.save();

        // Asynchronously index in Vector DB
        if (imagesUrl.length > 0) {
            import('axios').then(axios => {
                const embeddingServiceUrl = process.env.EMBEDDING_SERVICE_URL || 'http://127.0.0.1:8000';
                axios.default.post(`${embeddingServiceUrl}/index`, {
                    product_id: product._id.toString(),
                    image_url: imagesUrl[0]
                }).catch(err => console.warn('Vector indexing failed for seller product', product._id, ':', err.message));
            }).catch(() => {});
        }

        res.json({ success: true, message: "Product submitted successfully! Pending admin approval." });

    } catch (error) {
        console.error("Add Seller Product Error:", error);
        res.json({ success: false, message: error.message });
    }
};

const editSellerProduct = async (req, res) => {
    try {
        const { id, name, description, price, discount, category, subCategory, sizes, colors, material, stock, bestseller } = req.body;

        const product = await productModel.findOne({ _id: id, sellerId: req.sellerId });
        if (!product) {
            return res.json({ success: false, message: "Product not found or access denied" });
        }

        const updateData = {
            name: name || product.name,
            description: description || product.description,
            price: price !== undefined ? Number(price) : product.price,
            discount: discount !== undefined ? Number(discount) : product.discount,
            category: category || product.category,
            subCategory: subCategory || product.subCategory,
            material: material !== undefined ? material : product.material,
            bestseller: bestseller !== undefined ? (bestseller === "true" || bestseller === true) : product.bestseller,
            approvalStatus: product.approvalStatus || 'approved'
        };

        if (sizes) {
            updateData.sizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
        }
        if (colors) {
            updateData.colors = typeof colors === 'string' ? JSON.parse(colors) : colors;
        }
        if (stock) {
            updateData.stock = typeof stock === 'string' ? JSON.parse(stock) : stock;
        }

        await productModel.findByIdAndUpdate(id, updateData);

        res.json({ success: true, message: "Product updated & resubmitted for admin approval." });

    } catch (error) {
        console.error("Edit Seller Product Error:", error);
        res.json({ success: false, message: error.message });
    }
};

const deleteSellerProduct = async (req, res) => {
    try {
        const { id } = req.body;
        const deleted = await productModel.findOneAndDelete({ _id: id, sellerId: req.sellerId });
        if (!deleted) {
            return res.json({ success: false, message: "Product not found or unauthorized" });
        }
        res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 7. Seller Orders
const getSellerOrders = async (req, res) => {
    try {
        const sellerId = req.sellerId;
        const orders = await orderModel.find({ "items.sellerId": sellerId }).sort({ date: -1 });

        const formattedOrders = orders.map(order => {
            const sellerItems = order.items.filter(item => item.sellerId === sellerId);
            const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            return {
                _id: order._id,
                userId: order.userId,
                items: sellerItems,
                sellerAmount: sellerTotal,
                totalOrderAmount: order.amount,
                address: order.address,
                status: order.status,
                statusHistory: order.statusHistory || [],
                paymentMethod: order.paymentMethod,
                payment: order.payment,
                estimatedDelivery: order.estimatedDelivery,
                date: order.date
            };
        });

        res.json({ success: true, orders: formattedOrders });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const updateSellerOrderStatus = async (req, res) => {
    try {
        const { orderId, status, note } = req.body;
        const sellerId = req.sellerId;

        const order = await orderModel.findOne({ _id: orderId, "items.sellerId": sellerId });
        if (!order) {
            return res.json({ success: false, message: "Order not found or unauthorized" });
        }

        const validStatuses = ['Packing', 'Shipped', 'Out for Delivery', 'Delivered'];
        if (!validStatuses.includes(status)) {
            return res.json({ success: false, message: "Invalid order status transition" });
        }

        const now = Date.now();
        const sellerStore = req.seller?.storeName || 'Seller';
        const history = order.statusHistory || [];
        const newEntry = {
            status,
            timestamp: now,
            updatedBy: `${sellerStore} (Seller)`,
            note: note || `Status updated to ${status} by seller`
        };

        order.status = status;
        order.statusHistory = [...history, newEntry];
        order.updatedAt = now;

        await order.save();

        res.json({ success: true, message: `Order status updated to ${status}` });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 8. Inventory & Stock Management
const getInventory = async (req, res) => {
    try {
        const products = await productModel.find({ sellerId: req.sellerId }).sort({ name: 1 });
        
        const inventory = products.map(product => {
            const stockMap = product.stock || {};
            const totalStock = Object.values(stockMap).reduce((acc, qty) => acc + Number(qty), 0);
            
            let status = 'In Stock';
            if (totalStock === 0) status = 'Out of Stock';
            else if (totalStock <= 5) status = 'Low Stock';

            return {
                _id: product._id,
                name: product.name,
                image: product.image[0] || '',
                category: product.category,
                price: product.price,
                sizes: product.sizes,
                stock: stockMap,
                totalStock,
                status
            };
        });

        res.json({ success: true, inventory });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const updateStock = async (req, res) => {
    try {
        const { productId, stock } = req.body;
        const product = await productModel.findOne({ _id: productId, sellerId: req.sellerId });
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        product.stock = stock;
        await product.save();

        res.json({ success: true, message: "Stock updated successfully", stock: product.stock });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 9. Seller Analytics
const getAnalytics = async (req, res) => {
    try {
        const sellerId = req.sellerId;
        const { timeframe } = req.query; // 'week', 'month', 'all'

        const orders = await orderModel.find({ "items.sellerId": sellerId });

        let totalRevenue = 0;
        let totalUnitsSold = 0;
        const productSales = {};

        orders.forEach(order => {
            const sellerItems = order.items.filter(i => i.sellerId === sellerId);
            sellerItems.forEach(item => {
                const itemRevenue = item.price * item.quantity;
                totalUnitsSold += item.quantity;

                if (order.status === 'Delivered') {
                    totalRevenue += itemRevenue;
                }

                if (!productSales[item._id || item.name]) {
                    productSales[item._id || item.name] = {
                        name: item.name,
                        image: item.image?.[0] || item.image || '',
                        unitsSold: 0,
                        revenue: 0
                    };
                }
                productSales[item._id || item.name].unitsSold += item.quantity;
                productSales[item._id || item.name].revenue += itemRevenue;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        res.json({
            success: true,
            analytics: {
                totalRevenue,
                totalUnitsSold,
                totalOrders: orders.length,
                topProducts
            }
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 10. Earnings & Payouts
const getEarnings = async (req, res) => {
    try {
        const sellerId = req.sellerId;

        const orders = await orderModel.find({ "items.sellerId": sellerId });
        
        let totalEarnings = 0;
        let pendingEarnings = 0;

        orders.forEach(order => {
            const sellerItems = order.items.filter(i => i.sellerId === sellerId);
            const itemTotal = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const sellerShare = itemTotal * 0.90; // 10% platform fee deducted

            if (order.status === 'Delivered') {
                totalEarnings += sellerShare;
            } else if (order.status !== 'Cancelled') {
                pendingEarnings += sellerShare;
            }
        });

        const payouts = await payoutModel.find({ sellerId }).sort({ date: -1 });

        const completedPayouts = payouts
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);

        const availableBalance = Math.max(0, totalEarnings - completedPayouts);

        res.json({
            success: true,
            summary: {
                totalEarnings,
                pendingEarnings,
                completedPayouts,
                availableBalance
            },
            payouts
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const requestPayout = async (req, res) => {
    try {
        const sellerId = req.sellerId;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.json({ success: false, message: "Please enter a valid payout amount" });
        }

        const seller = await userModel.findById(sellerId);
        if (!seller.bankDetails || !seller.bankDetails.accountNumber) {
            return res.json({ success: false, message: "Please update your bank details in Store Profile before requesting a payout" });
        }

        const newPayout = new payoutModel({
            sellerId,
            amount: Number(amount),
            status: 'pending',
            bankDetails: seller.bankDetails,
            date: Date.now()
        });

        await newPayout.save();

        res.json({ success: true, message: "Payout request submitted successfully!" });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 11. Seller Product Reviews
const getSellerReviews = async (req, res) => {
    try {
        const sellerProducts = await productModel.find({ sellerId: req.sellerId }).select('_id');
        const productIds = sellerProducts.map(p => p._id.toString());

        const reviews = await reviewModel.find({ productId: { $in: productIds } }).sort({ date: -1 });

        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let totalRatingSum = 0;

        reviews.forEach(r => {
            ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
            totalRatingSum += r.rating;
        });

        const averageRating = reviews.length > 0 ? (totalRatingSum / reviews.length).toFixed(1) : 0;

        res.json({
            success: true,
            reviews,
            stats: {
                totalReviews: reviews.length,
                averageRating: Number(averageRating),
                distribution: ratingDistribution
            }
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 12. Seller Delete Own Account
const deleteSelfAccount = async (req, res) => {
    try {
        const sellerId = req.sellerId;
        const seller = await userModel.findByIdAndDelete(sellerId);
        if (!seller) {
            return res.json({ success: false, message: "Seller account not found" });
        }
        // Clean up seller's products
        await productModel.deleteMany({ sellerId });

        res.json({ success: true, message: "Your seller account has been deleted permanently." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export {
    registerSeller,
    applyForSeller,
    loginSeller,
    getSellerStatus,
    getSellerProfile,
    updateSellerProfile,
    getDashboardOverview,
    getSellerProducts,
    addSellerProduct,
    editSellerProduct,
    deleteSellerProduct,
    getSellerOrders,
    updateSellerOrderStatus,
    getInventory,
    updateStock,
    getAnalytics,
    getEarnings,
    requestPayout,
    getSellerReviews,
    deleteSelfAccount
};
