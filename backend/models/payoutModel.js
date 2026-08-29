import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
    sellerId: { type: String, required: false, index: true },
    deliveryPartnerId: { type: String, required: false, index: true },
    userType: { type: String, enum: ['seller', 'delivery'], default: 'seller' },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
    paymentMethod: { type: String, default: 'Bank Transfer' },
    bankDetails: { type: Object, default: {} },
    transactionId: { type: String, default: '' },
    note: { type: String, default: '' },
    date: { type: Number, required: true, default: Date.now }
});

const payoutModel = mongoose.models.payout || mongoose.model('payout', payoutSchema);

export default payoutModel;
