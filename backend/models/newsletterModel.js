import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    couponCode: { type: String } // The unique code generated for them
}, { timestamps: true });

const newsletterModel = mongoose.models.newsletter || mongoose.model('newsletter', newsletterSchema);
export default newsletterModel;
