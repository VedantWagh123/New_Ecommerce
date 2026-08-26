import mongoose from "mongoose";

const bankOfferSchema = new mongoose.Schema({
    bankName: { type: String, required: true },       // e.g. "HDFC BANK", "ICICI BANK"
    badgeText: { type: String, required: true },      // e.g. "10% OFF", "₹750 OFF"
    offerText: { type: String, required: true },      // e.g. "10% Instant Discount up to ₹1,500 on HDFC Cards & EMI."
    minPurchase: { type: Number, default: 0 },       // e.g. 3000
    terms: { type: String, required: true },          // Detailed T&C text for modal
    themeColor: { type: String, default: "blue" },   // "blue", "amber", "rose", "teal", "indigo"
    isActive: { type: Boolean, default: true },
    // Product Scope / Selection Fields
    appliesTo: { 
        type: String, 
        enum: ['ALL_PRODUCTS', 'SPECIFIC_CATEGORY', 'SPECIFIC_PRODUCTS'], 
        default: 'ALL_PRODUCTS' 
    },
    applicableCategory: { type: String, default: '' }, // e.g. "Men", "Women", "Kids"
    applicableProducts: [{ type: String }],            // Product IDs array
    date: { type: Number, default: () => Date.now() }
});

const bankOfferModel = mongoose.models.bankOffer || mongoose.model("bankOffer", bankOfferSchema);

export default bankOfferModel;
