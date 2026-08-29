import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: Array, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    sizes: { type: Array, required: true },
    bestseller: { type: Boolean },
    isFeatured: { type: Boolean, default: false },
    returnAvailable: { type: Boolean, default: true },
    cashOnDelivery: { type: Boolean, default: true },
    date: { type: Number, required: true },
    // Rating Aggregates
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    // Detailed Specifications
    brand: { type: String, default: 'Forever' },
    fabric: { type: String, default: '' },
    pattern: { type: String, default: '' },
    fit: { type: String, default: '' },
    sleeve: { type: String, default: '' },
    neck: { type: String, default: '' },
    occasion: { type: String, default: '' },
    season: { type: String, default: '' },
    careInstructions: { type: String, default: '' },
    // Multi-Vendor / Seller Fields
    sellerId: { type: String, default: null },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    rejectionReason: { type: String, default: '' },
    discount: { type: Number, default: 0 },
    colors: { type: Array, default: [] },
    material: { type: String, default: '' },
    // Admin-Controlled Trending Sub-Document
    trending: {
        enabled: { type: Boolean, default: false },
        status: { type: String, enum: ['NONE', 'PENDING', 'SCHEDULED', 'ACTIVE', 'REJECTED', 'EXPIRED', 'REMOVED'], default: 'NONE' },
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null },
        priority: { type: Number, default: 0 },
        requestedBy: { type: String, default: null },
        requestedAt: { type: Date, default: null },
        approvedBy: { type: String, default: null },
        approvedAt: { type: Date, default: null },
        rejectedAt: { type: Date, default: null },
        rejectionReason: { type: String, default: '' },
        removedAt: { type: Date, default: null }
    }
})

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

// Optimize database queries for search
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ price: 1 });

export default productModel;