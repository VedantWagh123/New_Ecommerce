import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
    warehouseId: { type: String, required: true, unique: true }, // e.g., 'WH_MUM', 'WH_DEL', 'WH_BLR'
    city: { type: String, required: true },
    address: { type: String, required: true },
    serviceablePincodes: { type: Array, default: [] },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    managerId: { type: String, default: null }, // Admin or Manager running the hub
    isActive: { type: Boolean, default: true },
    createdAt: { type: Number, default: Date.now }
});

const warehouseModel = mongoose.models.warehouse || mongoose.model('warehouse', warehouseSchema);
export default warehouseModel;
