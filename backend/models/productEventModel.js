import mongoose from "mongoose";

const productEventSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    sellerId: { type: String, required: true },
    userId: { type: String, default: null }, // Optional for tracking logged-in users
    eventType: { type: String, enum: ['VIEW', 'ADD_TO_CART'], required: true },
    timestamp: { type: Number, default: Date.now }
});

// Indexes for fast aggregation
productEventSchema.index({ sellerId: 1, eventType: 1, timestamp: -1 });
productEventSchema.index({ productId: 1, eventType: 1 });

const productEventModel = mongoose.models.productEvent || mongoose.model("productEvent", productEventSchema);

export default productEventModel;
