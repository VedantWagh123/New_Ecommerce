import mongoose from "mongoose";

const discoverVideoSchema = new mongoose.Schema({
    productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'product',
        required: true 
    },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    sellerId: { 
        type: String, 
        default: null 
    },
    status: { 
        type: String, 
        enum: ['published', 'unpublished'],
        default: 'published'
    },
    metrics: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 }
    }
}, { timestamps: true });

// Indexes for fast feed loading
discoverVideoSchema.index({ status: 1, createdAt: -1 });
discoverVideoSchema.index({ productId: 1 });
discoverVideoSchema.index({ sellerId: 1 });

const discoverVideoModel = mongoose.models.discoverVideo || mongoose.model("discoverVideo", discoverVideoSchema);
export default discoverVideoModel;
