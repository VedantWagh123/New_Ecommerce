import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
    sellerId: { type: String, required: true, index: true },
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
