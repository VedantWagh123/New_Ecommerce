import couponModel from "../models/couponModel.js";
import productModel from "../models/productModel.js";

// Add a new coupon
const addCoupon = async (req, res) => {
    try {
        const { code, type, value, minCartValue, conditions } = req.body;
        
        const exists = await couponModel.findOne({ code: code.toUpperCase() });
        if (exists) {
            return res.json({ success: false, message: "Coupon code already exists" });
        }

        const coupon = new couponModel({
            code: code.toUpperCase(),
            type,
            value,
            minCartValue,
            conditions
        });

        await coupon.save();
        res.json({ success: true, message: "Coupon created successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// List all coupons
const listCoupons = async (req, res) => {
    try {
        const coupons = await couponModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, coupons });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Delete coupon
const deleteCoupon = async (req, res) => {
    try {
        await couponModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Toggle coupon status
const toggleCoupon = async (req, res) => {
    try {
        const coupon = await couponModel.findById(req.body.id);
        coupon.isActive = !coupon.isActive;
        await coupon.save();
        res.json({ success: true, message: "Coupon status updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// THE COMPLEX COUPON ENGINE: Apply Coupon
const applyCoupon = async (req, res) => {
    try {
        const { code, cartData } = req.body; // cartData: { [itemId]: { [size]: quantity } }
        
        const coupon = await couponModel.findOne({ code: code.toUpperCase(), isActive: true });
        if (!coupon) {
            return res.json({ success: false, message: "Invalid or expired coupon code" });
        }

        if (coupon.isOneTime && coupon.isUsed) {
            return res.json({ success: false, message: "This coupon has already been used and is only valid for one order." });
        }

        // Fetch products in cart
        let totalCartValue = 0;
        let applicableItems = []; // Array of individual item prices that match conditions

        for (const itemId in cartData) {
            const product = await productModel.findById(itemId);
            if (!product) continue;

            let itemQty = 0;
            for (const size in cartData[itemId]) {
                itemQty += cartData[itemId][size];
            }

            if (itemQty > 0) {
                totalCartValue += product.price * itemQty;

                // Check if product matches coupon conditions
                const categoryMatch = coupon.conditions?.categories?.length === 0 || coupon.conditions.categories.includes(product.category);
                const subCategoryMatch = coupon.conditions?.subCategories?.length === 0 || coupon.conditions.subCategories.includes(product.subCategory);
                
                if (categoryMatch && subCategoryMatch) {
                    for (let i = 0; i < itemQty; i++) {
                        applicableItems.push(product.price);
                    }
                }
            }
        }

        if (totalCartValue < coupon.minCartValue) {
            return res.json({ success: false, message: `Minimum cart value of ₹${coupon.minCartValue} required` });
        }

        if (applicableItems.length === 0) {
            return res.json({ success: false, message: "Coupon is not applicable to the items in your cart" });
        }

        let discountAmount = 0;

        if (coupon.type === 'percentage') {
            const applicableTotal = applicableItems.reduce((a, b) => a + b, 0);
            discountAmount = (applicableTotal * coupon.value) / 100;
        } 
        else if (coupon.type === 'fixed') {
            discountAmount = coupon.value;
            const applicableTotal = applicableItems.reduce((a, b) => a + b, 0);
            if (discountAmount > applicableTotal) discountAmount = applicableTotal;
        } 
        else if (coupon.type === 'bogo') {
            // Sort ascending (cheapest items get discounted first)
            applicableItems.sort((a, b) => a - b);
            const { buy, get } = coupon.conditions.bogo;
            
            // Total grouping needed: e.g., Buy 2 Get 1 -> group of 3.
            const groupSize = buy + get;
            const totalGroups = Math.floor(applicableItems.length / groupSize);
            
            const freeItemsCount = totalGroups * get;
            
            // Sum the cheapest 'freeItemsCount' items
            for (let i = 0; i < freeItemsCount; i++) {
                discountAmount += applicableItems[i];
            }

            if (discountAmount === 0) {
                return res.json({ success: false, message: `Add ${groupSize - (applicableItems.length % groupSize)} more applicable item(s) to avail Buy ${buy} Get ${get} offer.` });
            }
        }

        res.json({ 
            success: true, 
            message: "Coupon applied successfully!",
            discount: Math.round(discountAmount) 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { addCoupon, listCoupons, deleteCoupon, toggleCoupon, applyCoupon };
