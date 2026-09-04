import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    addresses: { type: Array, default: [] },
    cartData: { type: Object, default: {} },
    cartUpdatedAt: { type: Date, default: null },
    abandonedMailSent: { type: Boolean, default: false },
    wishlist: { type: Array, default: [] },
    karmaScore: { type: Number, default: 100 },
    resetToken: { type: String, default: '' },
    resetTokenExpire: { type: Number, default: 0 },
    otpHash: { type: String, default: '' },
    otpExpiresAt: { type: Number, default: 0 },
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: { type: Number, default: 0 },
    role: { type: String, default: 'user' },
    isSeller: { type: Boolean, default: false },
    sellerStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    sellerRejectionReason: { type: String, default: '' },
    storeName: { type: String, default: '' },
    storeDescription: { type: String, default: '' },
    storePhone: { type: String, default: '' },
    storeCity: { type: String, default: '' },
    storePincode: { type: String, default: '' },
    storeLogo: { type: String, default: '' },
    isDeliveryPartner: { type: Boolean, default: false },
    isDeliveryOnline: { type: Boolean, default: false },
    deliveryStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    deliveryVehicle: { type: String, default: '' },
    drivingLicense: { type: String, default: '' },
    serviceCity: { type: String, default: '' },
    deliveryEarnings: { type: Number, default: 0 },
    liveLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        updatedAt: { type: Number, default: null }
    },
    bankDetails: {
        accountHolder: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        bankName: { type: String, default: '' },
        ifscCode: { type: String, default: '' }
    },
    razorpayAccountId: { type: String, default: '' }
}, { minimize: false })

const userModel = mongoose.models.user || mongoose.model('user',userSchema);

export default userModel