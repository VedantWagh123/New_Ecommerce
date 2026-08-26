import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    plan: { type: String, default: 'TRIAL_1RS' }, // 'TRIAL_1RS' | 'MONTHLY' | 'ANNUAL'
    amount: { type: Number, default: 1 },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'rejected', 'expired'], 
        default: 'pending' 
    },
    requestDate: { type: Number, default: () => Date.now() },
    approvedDate: { type: Number, default: null },
    expiryDate: { type: Number, default: null },
    note: { type: String, default: '' }
});

const subscriptionModel = mongoose.models.subscription || mongoose.model("subscription", subscriptionSchema);

export default subscriptionModel;
