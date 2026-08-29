import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: { type: Array, required: true },
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    address: { type: Object, required: true },
    status: { type: String, required: true, default: 'Packing' },
    statusHistory: { type: Array, default: [] },
    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, required: true, default: false },
    estimatedDelivery: { type: String, default: '' },
    couponCode: { type: String, default: '' },
    couponDiscount: { type: Number, default: 0 },
    date: { type: Number, required: true },
    updatedAt: { type: Number, default: Date.now },
    cancelStatus: { type: String, default: 'None', enum: ['None', 'Requested', 'Approved', 'Rejected'] },
    cancelReason: { type: String, default: '' }
})

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema)
export default orderModel;