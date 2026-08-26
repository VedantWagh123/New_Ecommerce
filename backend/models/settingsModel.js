import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    platformCommission: { type: Number, default: 10, required: true }, // Percentage (e.g., 10 for 10%)
    updatedAt: { type: Number, default: Date.now }
}, { minimize: false });

const settingsModel = mongoose.models.settings || mongoose.model('settings', settingsSchema);

export default settingsModel;
