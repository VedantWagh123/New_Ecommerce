import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  orderId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: "" },
  comment: { type: String, required: true },
  images: { type: Array, default: [] },
  attributes: {
    fit: { type: Number, default: 5 }, // 1-5
    quality: { type: Number, default: 5 }, // 1-5
    comfort: { type: Number, default: 5 }, // 1-5
    material: { type: Number, default: 5 }, // 1-5
    colorAccuracy: { type: Number, default: 5 } // 1-5
  },
  verifiedPurchase: { type: Boolean, default: true },
  hidden: { type: Boolean, default: false },
  date: { type: Number, required: true }
});

const reviewModel = mongoose.models.review || mongoose.model("review", reviewSchema);

export default reviewModel;
