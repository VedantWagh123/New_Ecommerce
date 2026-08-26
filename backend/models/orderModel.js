import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: { type: Array, required: true },
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    status: { type: String, required: true, default: 'Packing' },
    statusHistory: { type: Array, default: [] },
    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, required: true, default: false },
    estimatedDelivery: { type: String, default: '' },
    couponCode: { type: String, default: '' },
    couponDiscount: { type: Number, default: 0 },
    date: { type: Number, required: true },
    updatedAt: { type: Number, default: Date.now }
})

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema)
export default orderModel;