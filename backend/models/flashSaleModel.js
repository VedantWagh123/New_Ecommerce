import mongoose from 'mongoose';

const flashSaleSchema = new mongoose.Schema({
    title: { type: String, default: 'LIMITED TIME MIDNIGHT SALE' },
    subtitle: { type: String, default: 'Exclusive Flash Deals — Up to 40% OFF' },
    isActive: { type: Boolean, default: true },
    endTime: { type: Date, required: true },
    discountPercent: { type: Number, default: 35 },
    stockClaimedPercent: { type: Number, default: 85 },
    selectedProducts: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
            discountPercent: { type: Number, default: 35 },
            allocatedStock: { type: Number, default: 50 },
            claimedStock: { type: Number, default: 42 }
        }
    ]
}, { timestamps: true });

const flashSaleModel = mongoose.models.flashSale || mongoose.model('flashSale', flashSaleSchema);
export default flashSaleModel;
