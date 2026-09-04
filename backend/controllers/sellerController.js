import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import reviewModel from "../models/reviewModel.js";
import payoutModel from "../models/payoutModel.js";
import settingsModel from "../models/settingsModel.js";
import { sendNotification, getIO, emitProductUpdate, emitOrderUpdate } from "../config/socket.js";
import { clearProductCache } from "../config/redis.js";
import { calculateSellerShare } from "../utils/financeUtils.js";
import { autoAssignToDeliveryBoy } from "./orderController.js";

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
        const { storeName, storePhone, storeCity, storePincode, storeDescription, storeLogo, bankDetails, name } = req.body;

        const updateData = {};
        if (storeName) updateData.storeName = storeName;
        if (storePhone !== undefined) updateData.storePhone = storePhone;
        if (storeCity !== undefined) updateData.storeCity = storeCity;
        if (storePincode !== undefined) updateData.storePincode = storePincode;
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
            'Placed': 0,
            'Packing': 0,
            'Ready to Ship': 0,
            'Handed to Logistics': 0,
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

                // Populate sales trend (last 7 days only)
                if (order.status === 'Delivered') {
                    const dateObj = new Date(order.date);
                    const now = new Date();
                    const diffTime = Math.abs(now - dateObj);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays <= 7) {
                        const dateStr = dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                        if (!salesByDate[dateStr]) {
                            salesByDate[dateStr] = 0;
                        }
                        salesByDate[dateStr] += itemTotal;
                    }
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
            sizes, colors, material, bestseller, returnAvailable, cashOnDelivery, stock, warehouseInventory
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

        let parsedWarehouseInventory = [];
        if (warehouseInventory) {
            try {
                parsedWarehouseInventory = typeof warehouseInventory === 'string' ? JSON.parse(warehouseInventory) : warehouseInventory;
            } catch (e) {
                parsedWarehouseInventory = [];
            }
        } else if (Object.keys(parsedStock).length > 0) {
            const totalStock = Object.values(parsedStock).reduce((acc, qty) => acc + Number(qty), 0);
            parsedWarehouseInventory = [
                { warehouseId: 'WH_NAGPUR', stock: totalStock, reserved: 0 },
                { warehouseId: 'WH_WARDHA', stock: 0, reserved: 0 },
                { warehouseId: 'WH_DHAMANGAON', stock: 0, reserved: 0 }
            ];
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

        let parsedCategory = [];
        if (category) {
            try {
                parsedCategory = typeof category === 'string' ? JSON.parse(category) : category;
            } catch (e) {
                parsedCategory = typeof category === 'string' ? [category] : [];
            }
        }

        const productData = {
            name,
            description,
            price: Number(price),
            discount: discount ? Number(discount) : 0,
            category: parsedCategory,
            subCategory,
            sizes: parsedSizes,
            colors: parsedColors,
            material: material || '',
            bestseller: bestseller === "true" || bestseller === true,
            returnAvailable: returnAvailable === "true" || returnAvailable === true,
            cashOnDelivery: cashOnDelivery === "true" || cashOnDelivery === true,
            stock: parsedStock,
            warehouseInventory: parsedWarehouseInventory,
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

        emitProductUpdate({ sellerId: req.sellerId });
        await clearProductCache();

        res.json({ success: true, message: "Product submitted successfully! Pending admin approval." });

    } catch (error) {
        console.error("Add Seller Product Error:", error);
        res.json({ success: false, message: error.message });
    }
};

const editSellerProduct = async (req, res) => {
    try {
        const { id, name, description, price, discount, category, subCategory, sizes, colors, material, stock, bestseller, warehouseInventory } = req.body;

        const product = await productModel.findOne({ _id: id, sellerId: req.sellerId });
        if (!product) {
            return res.json({ success: false, message: "Product not found or access denied" });
        }

        const updateData = {
            name: name || product.name,
            description: description || product.description,
            price: price !== undefined ? Number(price) : product.price,
            discount: discount !== undefined ? Number(discount) : product.discount,
            subCategory: subCategory || product.subCategory,
            material: material !== undefined ? material : product.material,
            bestseller: bestseller !== undefined ? (bestseller === "true" || bestseller === true) : product.bestseller,
            approvalStatus: product.approvalStatus || 'approved'
        };

        if (category) {
            try {
                updateData.category = typeof category === 'string' ? JSON.parse(category) : category;
            } catch (e) {
                updateData.category = typeof category === 'string' ? [category] : [];
            }
        } else {
            updateData.category = product.category;
        }

        if (sizes) {
            updateData.sizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
        }
        if (colors) {
            updateData.colors = typeof colors === 'string' ? JSON.parse(colors) : colors;
        }
        if (stock) {
            updateData.stock = typeof stock === 'string' ? JSON.parse(stock) : stock;
            
            if (!warehouseInventory) {
                const totalStock = Object.values(updateData.stock).reduce((acc, qty) => acc + Number(qty), 0);
                updateData.warehouseInventory = [
                    { warehouseId: 'WH_NAGPUR', stock: totalStock, reserved: 0 },
                    { warehouseId: 'WH_WARDHA', stock: 0, reserved: 0 },
                    { warehouseId: 'WH_DHAMANGAON', stock: 0, reserved: 0 }
                ];
            }
        }
        
        if (warehouseInventory) {
            updateData.warehouseInventory = typeof warehouseInventory === 'string' ? JSON.parse(warehouseInventory) : warehouseInventory;
        }

        await productModel.findByIdAndUpdate(id, updateData);

        emitProductUpdate({ sellerId: req.sellerId });
        await clearProductCache();

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
        
        emitProductUpdate({ sellerId: req.sellerId });
        await clearProductCache();

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

        if (order.cancelStatus === 'Requested') {
            return res.json({ success: false, message: "Cannot update status while a cancellation request is pending." });
        }

        const validSellerStatuses = ['Packing', 'Accepted', 'Packed', 'Ready for Pickup'];
        const currentStatusIdx = validSellerStatuses.indexOf(order.status);
        
        if (currentStatusIdx === -1) {
            return res.json({ success: false, message: `Order has passed seller control (Current Status: ${order.status})` });
        }

        // Specific allow-list for seller cancelling/rejecting an order
        if (status === 'Cancelled') {
            if (order.status !== 'Packing' && order.status !== 'Accepted') {
                return res.json({ success: false, message: `Cannot reject order after it has been packed or dispatched.` });
            }
        } else {
            const nextStatusIdx = validSellerStatuses.indexOf(status);
            
            if (nextStatusIdx === -1) {
                return res.json({ success: false, message: "Sellers cannot set Admin/Logistics statuses manually." });
            }

            if (nextStatusIdx <= currentStatusIdx) {
                return res.json({ success: false, message: "Cannot move order status backwards." });
            }

            if (nextStatusIdx !== currentStatusIdx + 1) {
                return res.json({ success: false, message: `Invalid transition. Next valid status is: ${validSellerStatuses[currentStatusIdx + 1]}` });
            }
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

        // Send notification to Admin for ALL status updates
        await sendNotification('admin', null, `Order ${status}`, `Order #${order._id.toString().slice(-8).toUpperCase()} status updated to ${status} by seller ${sellerStore}.`, order._id);

        emitOrderUpdate(order);
        
        if (status === 'Ready for Pickup') {
            await autoAssignToDeliveryBoy(order._id);
        }

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
            // Primary: use warehouseInventory if it exists and has data
            let totalStock = 0;
            let stockMap = {};

            if (product.warehouseInventory && product.warehouseInventory.length > 0) {
                // Sum across all warehouses
                product.warehouseInventory.forEach(wh => {
                    if (wh.stockMap && Object.keys(wh.stockMap).length > 0) {
                        // Variant-level stock map exists
                        Object.entries(wh.stockMap).forEach(([size, qty]) => {
                            stockMap[size] = (stockMap[size] || 0) + Number(qty);
                            totalStock += Number(qty);
                        });
                    } else {
                        // Only aggregate stock number, no size breakdown
                        totalStock += Number(wh.stock || 0);
                    }
                });
            } else {
                // Fallback: use legacy stock map on product
                const rawStock = product.toObject ? product.toObject() : product;
                const legacyStock = rawStock.stock || {};
                stockMap = legacyStock;
                totalStock = Object.values(legacyStock).reduce((acc, qty) => acc + Number(qty), 0);
            }

            // If stockMap empty but we have sizes, initialize to 0
            if (Object.keys(stockMap).length === 0 && product.sizes?.length > 0) {
                product.sizes.forEach(size => { stockMap[size] = 0; });
            }

            let status = 'In Stock';
            if (totalStock === 0) status = 'Out of Stock';
            else if (totalStock <= 5) status = 'Low Stock';

            return {
                _id: product._id,
                name: product.name,
                image: product.image?.[0] || '',
                category: Array.isArray(product.category) ? product.category.join(', ') : product.category,
                price: product.price,
                sizes: product.sizes || [],
                stock: stockMap,
                warehouseInventory: product.warehouseInventory || [],
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
        const { productId, stock, warehouseInventory } = req.body;
        const product = await productModel.findOne({ _id: productId, sellerId: req.sellerId });
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        product.stock = stock;
        
        if (warehouseInventory) {
            product.warehouseInventory = typeof warehouseInventory === 'string' ? JSON.parse(warehouseInventory) : warehouseInventory;
        } else if (stock) {
            const parsedStock = typeof stock === 'string' ? JSON.parse(stock) : stock;
            const totalStock = Object.values(parsedStock).reduce((acc, qty) => acc + Number(qty), 0);
            product.warehouseInventory = [
                { warehouseId: 'WH_NAGPUR', stock: totalStock, reserved: 0 },
                { warehouseId: 'WH_WARDHA', stock: 0, reserved: 0 },
                { warehouseId: 'WH_DHAMANGAON', stock: 0, reserved: 0 }
            ];
        }

        await product.save();
        
        emitProductUpdate(product);
        await clearProductCache();

        res.json({ success: true, message: "Stock updated successfully", stock: product.stock });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 9. Seller Analytics
const getAnalytics = async (req, res) => {
    try {
        const sellerId = req.sellerId;
        let { timeframe } = req.query; // 'today', '7d', '30d', '90d', 'all'
        if (!timeframe) timeframe = '30d';

        let settings = await settingsModel.findOne();
        const commissionRate = settings ? (settings.platformCommission / 100) : 0.10;

        // Date calculation
        const now = new Date();
        let startDate = new Date(0); // 'all'

        if (timeframe === 'today') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (timeframe === '7d' || timeframe === 'week') {
            startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (timeframe === '30d' || timeframe === 'month') {
            startDate = new Date(now.setDate(now.getDate() - 30));
        } else if (timeframe === '90d') {
            startDate = new Date(now.setDate(now.getDate() - 90));
        }

        const startTimestamp = startDate.getTime();

        const allOrders = await orderModel.find({ "items.sellerId": sellerId });
        
        // Filter orders by date
        const orders = timeframe === 'all' 
            ? allOrders 
            : allOrders.filter(order => order.date >= startTimestamp);

        let totalDeliveries = 0;
        let totalEarnings = 0;
        let cancelledOrders = 0;
        let failedDeliveries = 0;
        
        const deliveryStatus = {
            delivered: 0,
            inTransit: 0,
            pending: 0,
            failed: 0,
            cancelled: 0
        };

        const earningsTrendMap = {};
        const deliveriesTrendMap = {};

        // To calculate average rating
        const productModel = (await import('../models/productModel.js')).default;
        const reviewModel = (await import('../models/reviewModel.js')).default;
        const sellerProducts = await productModel.find({ sellerId }, '_id');
        const productIds = sellerProducts.map(p => p._id.toString());
        const reviews = await reviewModel.find({ productId: { $in: productIds } });
        
        const averageRating = reviews.length > 0 
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
            : 0;

        orders.forEach(order => {
            const { sellerShare } = calculateSellerShare(order, sellerId, commissionRate);
            
            // Format date for trends
            const dateStr = new Date(order.date).toLocaleDateString('default', { month: 'short', day: 'numeric' });
            
            if (!earningsTrendMap[dateStr]) earningsTrendMap[dateStr] = 0;
            if (!deliveriesTrendMap[dateStr]) deliveriesTrendMap[dateStr] = 0;

            // Categorize Status
            const status = order.status;
            if (status === 'Delivered') {
                totalDeliveries++;
                totalEarnings += sellerShare;
                deliveryStatus.delivered++;
                
                earningsTrendMap[dateStr] += sellerShare;
                deliveriesTrendMap[dateStr]++;
            } else if (status === 'Cancelled' || order.cancelStatus === 'Approved') {
                cancelledOrders++;
                deliveryStatus.cancelled++;
            } else if (status === 'Delivery Failed' || status === 'Returned') {
                failedDeliveries++;
                deliveryStatus.failed++;
            } else if (['Shipped', 'Out for delivery', 'Ready for Pickup'].includes(status)) {
                deliveryStatus.inTransit++;
            } else {
                deliveryStatus.pending++;
            }
        });

        // Compute trends arrays
        const earningsTrend = Object.keys(earningsTrendMap).map(date => ({
            date,
            revenue: earningsTrendMap[date]
        }));
        
        const deliveriesTrend = Object.keys(deliveriesTrendMap).map(date => ({
            date,
            deliveries: deliveriesTrendMap[date]
        }));

        // Success Rate and Performance Score
        const totalActionableOrders = totalDeliveries + cancelledOrders + failedDeliveries;
        const successRate = totalActionableOrders > 0 
            ? ((totalDeliveries / totalActionableOrders) * 100).toFixed(1) 
            : 100;

        const performanceScore = Math.min(100, Math.max(0, 
            (successRate * 0.7) + (Number(averageRating) * 20 * 0.3)
        )).toFixed(0);

        // Generate Insights dynamically
        const insights = [];
        if (totalDeliveries > 0) {
            insights.push(`You completed ${totalDeliveries} deliveries in this period.`);
            if (successRate >= 95) insights.push("Great job! Your successful delivery rate is excellent.");
            if (averageRating >= 4.5) insights.push("High customer satisfaction. Your rating is among top sellers.");
        } else {
            insights.push("Complete more deliveries to unlock performance insights.");
        }

        res.json({
            success: true,
            analytics: {
                overview: {
                    totalDeliveries,
                    totalEarnings,
                    averageRating,
                    successRate,
                    cancelledOrders,
                    failedDeliveries
                },
                earningsTrend,
                deliveriesTrend,
                deliveryStatus,
                performanceScore,
                insights
            }
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 9.5 Advanced Seller Product Analytics
const getAdvancedProductAnalytics = async (req, res) => {
    try {
        const sellerId = req.sellerId;
        const { startDate, endDate, compStartDate, compEndDate } = req.query;

        let settings = await settingsModel.findOne();
        const commissionRate = settings ? (settings.platformCommission / 100) : 0.10;

        // Helper to run pipeline for a given date range
        const getMetricsForRange = async (start, end) => {
            const startNum = Number(start);
            const endNum = Number(end);
            
            const productEventModel = (await import('../models/productEventModel.js')).default;
            const orderModel = (await import('../models/orderModel.js')).default;

            // 1. Get Views and Add to Cart
            const events = await productEventModel.aggregate([
                { 
                    $match: { 
                        sellerId, 
                        timestamp: { $gte: startNum, $lte: endNum }
                    } 
                },
                {
                    $group: {
                        _id: "$eventType",
                        count: { $sum: 1 }
                    }
                }
            ]);

            const views = events.find(e => e._id === 'VIEW')?.count || 0;
            const carts = events.find(e => e._id === 'ADD_TO_CART')?.count || 0;

            // 2. Get Orders, Revenue, Units Sold
            const orders = await orderModel.find({ 
                "items.sellerId": sellerId,
                date: { $gte: startNum, $lte: endNum }
            });

            let revenue = 0;
            let unitsSold = 0;
            let totalOrders = orders.length;

            orders.forEach(order => {
                const { sellerShare } = calculateSellerShare(order, sellerId, commissionRate);
                
                const sellerItems = order.items.filter(i => i.sellerId === sellerId);
                sellerItems.forEach(item => {
                    unitsSold += item.quantity;
                });
                
                if (order.status === 'Delivered') {
                    revenue += sellerShare;
                }
            });

            return { views, carts, orders: totalOrders, revenue, unitsSold };
        };

        const getTrendsForRange = async (start, end, orderList) => {
            const startNum = Number(start);
            const endNum = Number(end);
            const productEventModel = (await import('../models/productEventModel.js')).default;
            const trendsMap = {};
            const allEvents = await productEventModel.find({
                sellerId,
                timestamp: { $gte: startNum, $lte: endNum }
            });
            
            allEvents.forEach(e => {
                const dateStr = new Date(e.timestamp).toLocaleDateString('default', { month: 'short', day: 'numeric' });
                if (!trendsMap[dateStr]) trendsMap[dateStr] = { date: dateStr, views: 0, carts: 0, revenue: 0, unitsSold: 0, timestamp: e.timestamp };
                if (e.eventType === 'VIEW') trendsMap[dateStr].views += 1;
                if (e.eventType === 'ADD_TO_CART') trendsMap[dateStr].carts += 1;
            });

            orderList.forEach(order => {
                const dateStr = new Date(order.date).toLocaleDateString('default', { month: 'short', day: 'numeric' });
                if (!trendsMap[dateStr]) trendsMap[dateStr] = { date: dateStr, views: 0, carts: 0, revenue: 0, unitsSold: 0, timestamp: order.date };
                
                const { sellerShare } = calculateSellerShare(order, sellerId, commissionRate);
                
                const sellerItems = order.items.filter(i => i.sellerId === sellerId);
                sellerItems.forEach(item => {
                    trendsMap[dateStr].unitsSold += item.quantity;
                });

                if (order.status === 'Delivered') {
                    trendsMap[dateStr].revenue += sellerShare;
                }
            });

            return Object.values(trendsMap).sort((a, b) => a.timestamp - b.timestamp);
        };

        const current = await getMetricsForRange(startDate, endDate);
        let comparison = null;
        let compOrdersList = [];
        if (compStartDate && compEndDate) {
            comparison = await getMetricsForRange(compStartDate, compEndDate);
            const orderModel = (await import('../models/orderModel.js')).default;
            compOrdersList = await orderModel.find({ 
                "items.sellerId": sellerId,
                date: { $gte: Number(compStartDate), $lte: Number(compEndDate) }
            });
        }

        // Product level metrics
        const productEventModel = (await import('../models/productEventModel.js')).default;
        const productEvents = await productEventModel.aggregate([
            { 
                $match: { 
                    sellerId, 
                    timestamp: { $gte: Number(startDate), $lte: Number(endDate) }
                } 
            },
            {
                $group: {
                    _id: { productId: "$productId", eventType: "$eventType" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const productMetricsMap = {};
        productEvents.forEach(e => {
            const pid = e._id.productId;
            if (!productMetricsMap[pid]) productMetricsMap[pid] = { views: 0, carts: 0, unitsSold: 0, revenue: 0, orders: 0 };
            if (e._id.eventType === 'VIEW') productMetricsMap[pid].views = e.count;
            if (e._id.eventType === 'ADD_TO_CART') productMetricsMap[pid].carts = e.count;
        });

        const currentOrdersList = await orderModel.find({ 
            "items.sellerId": sellerId,
            date: { $gte: Number(startDate), $lte: Number(endDate) }
        });

        currentOrdersList.forEach(order => {
                const { sellerShare, sellerItems, itemTotal } = calculateSellerShare(order, sellerId, commissionRate);
                const netRatio = itemTotal > 0 ? (sellerShare / itemTotal) : 0;
                const uniqueProductIdsInOrder = new Set(sellerItems.map(i => i._id || i.name));
                
                sellerItems.forEach(item => {
                    const pid = item._id || item.name;
                    if (!productMetricsMap[pid]) productMetricsMap[pid] = { views: 0, carts: 0, unitsSold: 0, revenue: 0, orders: 0 };
                    
                    productMetricsMap[pid].unitsSold += item.quantity;
                    if (order.status === 'Delivered') {
                        const itemNetRevenue = (item.price * item.quantity) * netRatio;
                        productMetricsMap[pid].revenue += itemNetRevenue;
                    }
                });
                
                uniqueProductIdsInOrder.forEach(pid => {
                    if (productMetricsMap[pid]) {
                        productMetricsMap[pid].orders += 1;
                    }
                });
            });

        // Merge with product details
        const productsList = await productModel.find({ sellerId });
        const productPerformance = productsList.map(p => {
            const pid = p._id.toString();
            const metrics = productMetricsMap[pid] || { views: 0, carts: 0, unitsSold: 0, revenue: 0, orders: 0 };
            const stockValues = Object.values(p.stock || {});
            const totalStock = stockValues.reduce((a, b) => a + Number(b), 0);
            
            let badge = 'Average';
            const conv = metrics.views > 0 ? (metrics.orders / metrics.views) : 0;
            if (metrics.revenue > 1000 && conv > 0.05) badge = 'Excellent';
            else if (metrics.revenue > 0) badge = 'Good';
            else if (metrics.views > 100 && metrics.orders === 0) badge = 'Needs Attention';

            return {
                id: pid,
                name: p.name,
                image: p.image?.[0] || '',
                price: p.price,
                category: p.category,
                stock: totalStock,
                ...metrics,
                conversionRate: conv * 100,
                cartRate: metrics.views > 0 ? (metrics.carts / metrics.views) * 100 : 0,
                badge
            };
        });

        // Trends 
        const trends = await getTrendsForRange(startDate, endDate, currentOrdersList);
        let compTrends = [];
        if (compStartDate && compEndDate) {
            compTrends = await getTrendsForRange(compStartDate, compEndDate, compOrdersList);
        }

        res.json({
            success: true,
            current,
            comparison,
            productPerformance,
            trends,
            compTrends
        });
    } catch (error) {
        console.error("Advanced Analytics Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// 10. Earnings & Payouts
const getEarnings = async (req, res) => {
    try {
        const sellerId = req.sellerId;

        let settings = await settingsModel.findOne();
        const commissionRate = settings ? (settings.platformCommission / 100) : 0.10;

        const orders = await orderModel.find({ "items.sellerId": sellerId });
        
        let totalEarnings = 0;
        let pendingEarnings = 0;

        orders.forEach(order => {
            const { sellerShare } = calculateSellerShare(order, sellerId, commissionRate);

            if (order.status === 'Delivered') {
                if (order.paymentMethod === 'COD' && order.payment === false) {
                    // COD delivered but cash not remitted/collected yet
                    pendingEarnings += sellerShare;
                } else {
                    totalEarnings += sellerShare;
                }
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

// ------------------------------------------------------------------
// RETURN & QC WORKFLOW (SELLER)
// ------------------------------------------------------------------

const getReturns = async (req, res) => {
    try {
        const sellerId = req.sellerId;
        // Fetch orders that belong to this seller and have a return requested
        const orders = await orderModel.find({ 
            "items.sellerId": sellerId, 
            returnStatus: { $ne: 'None' } 
        }).sort({ returnDate: -1 });

        const formattedReturns = orders.map(order => {
            const sellerItems = order.items.filter(item => item.sellerId === sellerId);
            return {
                _id: order._id,
                userId: order.userId,
                items: sellerItems,
                returnStatus: order.returnStatus,
                returnReason: order.returnReason,
                returnImages: order.returnImages,
                returnDate: order.returnDate,
                date: order.date
            };
        });

        res.json({ success: true, returns: formattedReturns });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const approveReturn = async (req, res) => {
    try {
        const { orderId } = req.body;
        const sellerId = req.sellerId;

        const order = await orderModel.findOne({ _id: orderId, "items.sellerId": sellerId });
        if (!order) return res.json({ success: false, message: "Order not found" });

        if (order.returnStatus !== 'Requested') {
            return res.json({ success: false, message: "Return not in Requested state." });
        }

        const history = order.statusHistory || [];
        history.push({
            status: 'Return Approved',
            timestamp: Date.now(),
            updatedBy: req.seller?.storeName || 'Seller',
            note: 'Return approved by seller. Awaiting pickup assignment.'
        });

        order.returnStatus = 'Approved';
        order.statusHistory = history;
        order.updatedAt = Date.now();
        // Clear delivery partner ID so it can be reassigned for reverse pickup
        order.deliveryPartnerId = null;

        await order.save();
        
        await sendNotification('user', order.userId, 'Return Approved', `Your return request for Order #${order._id.toString().slice(-8).toUpperCase()} has been approved.`, order._id);
        emitOrderUpdate(order);

        res.json({ success: true, message: "Return approved successfully." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const rejectReturn = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        const sellerId = req.sellerId;

        const order = await orderModel.findOne({ _id: orderId, "items.sellerId": sellerId });
        if (!order) return res.json({ success: false, message: "Order not found" });

        if (order.returnStatus !== 'Requested') {
            return res.json({ success: false, message: "Return not in Requested state." });
        }

        const history = order.statusHistory || [];
        history.push({
            status: 'Return Rejected',
            timestamp: Date.now(),
            updatedBy: req.seller?.storeName || 'Seller',
            note: `Return rejected. Reason: ${reason || 'Not specified'}`
        });

        order.returnStatus = 'Rejected';
        order.statusHistory = history;
        order.updatedAt = Date.now();

        await order.save();
        
        await sendNotification('user', order.userId, 'Return Rejected', `Your return request for Order #${order._id.toString().slice(-8).toUpperCase()} was rejected.`, order._id);
        emitOrderUpdate(order);

        res.json({ success: true, message: "Return rejected successfully." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const updateReturnQC = async (req, res) => {
    try {
        const { orderId, passed, reason } = req.body;
        const sellerId = req.sellerId;

        const order = await orderModel.findOne({ _id: orderId, "items.sellerId": sellerId });
        if (!order) return res.json({ success: false, message: "Order not found" });

        // Seller can only QC if the item has been received or is in transit to them
        if (!['In Transit', 'Received'].includes(order.returnStatus)) {
            return res.json({ success: false, message: `Cannot perform QC. Current status: ${order.returnStatus}` });
        }

        const now = Date.now();
        const history = order.statusHistory || [];
        
        if (passed) {
            history.push({
                status: 'Return QC Passed',
                timestamp: now,
                updatedBy: req.seller?.storeName || 'Seller',
                note: 'Product received and Quality Check passed. Refund pending.'
            });
            order.returnStatus = 'Received';
            order.refundStatus = 'Pending';
        } else {
            history.push({
                status: 'Return QC Failed',
                timestamp: now,
                updatedBy: req.seller?.storeName || 'Seller',
                note: `Quality Check failed. Reason: ${reason || 'Damaged/Missing items'}`
            });
            order.returnStatus = 'QC Failed';
            order.refundStatus = 'Failed';
        }

        order.statusHistory = history;
        order.updatedAt = now;

        await order.save();
        
        await sendNotification('admin', null, passed ? 'Refund Pending' : 'QC Failed', `Order #${order._id.toString().slice(-8).toUpperCase()} QC ${passed ? 'passed' : 'failed'} by seller.`, order._id);
        emitOrderUpdate(order);

        res.json({ success: true, message: `QC ${passed ? 'Passed' : 'Failed'} recorded successfully.` });
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
    getAdvancedProductAnalytics,
    getEarnings,
    requestPayout,
    getSellerReviews,
    deleteSelfAccount,
    getReturns,
    approveReturn,
    rejectReturn,
    updateReturnQC
};
