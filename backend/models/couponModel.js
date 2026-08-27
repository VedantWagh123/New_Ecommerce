import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['percentage', 'fixed', 'bogo'], required: true },
    value: { type: Number, required: true }, // Discount amount (₹) or percentage (%), or 0 for bogo
    minCartValue: { type: Number, default: 0 },
    conditions: {
        categories: { type: Array, default: [] }, // e.g. ['Men', 'Women']
        subCategories: { type: Array, default: [] }, // e.g. ['Winterwear', 'Topwear']
        bogo: {
            buy: { type: Number, default: 1 },
            get: { type: Number, default: 1 }
        }
    },
    isActive: { type: Boolean, default: true },
    isOneTime: { type: Boolean, default: false },
    isUsed: { type: Boolean, default: false },
    linkedEmail: { type: String, default: null }
}, { timestamps: true });

const couponModel = mongoose.models.coupon || mongoose.model('coupon', couponSchema);
export default couponModel;
