import reviewModel from "../models/reviewModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

// Helper function to update product rating aggregates
const updateProductRatingStats = async (productId) => {
  try {
    const activeReviews = await reviewModel.find({ productId, hidden: false });
    const totalReviews = activeReviews.length;
    let averageRating = 0;

    if (totalReviews > 0) {
      const sum = activeReviews.reduce((acc, curr) => acc + curr.rating, 0);
      averageRating = Number((sum / totalReviews).toFixed(1));
    }

    await productModel.findByIdAndUpdate(productId, {
      averageRating,
      totalReviews
    });
  } catch (error) {
    console.error("Error updating product rating stats:", error);
  }
};

// Add Review Controller
const addReview = async (req, res) => {
  try {
    const { userId, productId, orderId, rating, title, comment, attributes } = req.body;

    if (!productId || !orderId || !rating || !comment) {
      return res.json({ success: false, message: "Please fill all required review fields." });
    }

    // 1. Verify User
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User authentication failed." });
    }

    // 2. Verify Order
    const order = await orderModel.findById(orderId);
    if (!order || order.userId !== userId) {
      return res.json({ success: false, message: "Order not found or access denied." });
    }

    // 3. Verify Order Delivered Status
    if (order.status.toLowerCase() !== 'delivered') {
      return res.json({ success: false, message: "Reviews can only be submitted after order delivery." });
    }

    // 4. Verify Product in Order
    const itemInOrder = order.items.find(item => item._id === productId || item.id === productId);
    if (!itemInOrder) {
      return res.json({ success: false, message: "This product was not found in the delivered order." });
    }

    // 5. Prevent Duplicate Reviews for same Order + Product
    const existingReview = await reviewModel.findOne({ productId, userId, orderId });
    if (existingReview) {
      return res.json({ success: false, message: "You have already reviewed this product for this order." });
    }

    // 6. Handle Review Photos upload (if uploaded via req.files)
    let imagesUrl = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_SECRET_KEY
      });

      imagesUrl = await Promise.all(
        req.files.map(async (file) => {
          let result = await cloudinary.uploader.upload(file.path, { resource_type: 'image' });
          return result.secure_url;
        })
      );
    } else if (req.body.images && Array.isArray(req.body.images)) {
      imagesUrl = req.body.images;
    }

    // Parse attributes
    let parsedAttributes = { fit: 5, quality: 5, comfort: 5, material: 5, colorAccuracy: 5 };
    if (attributes) {
      try {
        const obj = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
        parsedAttributes = { ...parsedAttributes, ...obj };
      } catch (e) {}
    }

    // 7. Save Review
    const reviewData = {
      productId,
      userId,
      userName: user.name || user.email.split('@')[0],
      orderId,
      rating: Number(rating),
      title: title || "",
      comment,
      images: imagesUrl,
      attributes: parsedAttributes,
      verifiedPurchase: true,
      hidden: false,
      date: Date.now()
    };

    const newReview = new reviewModel(reviewData);
    await newReview.save();

    // 8. Update Product Rating Aggregates
    await updateProductRatingStats(productId);

    res.json({ success: true, message: "Thank you! Your review has been submitted." });
  } catch (error) {
    console.error("Add Review Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get Product Reviews Controller
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await reviewModel.find({ productId, hidden: false }).sort({ date: -1 });

    const totalReviews = reviews.length;
    let sumRating = 0;
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const attrSums = { fit: 0, quality: 0, comfort: 0, material: 0, colorAccuracy: 0 };

    reviews.forEach(r => {
      sumRating += r.rating;
      if (ratingCounts[r.rating] !== undefined) ratingCounts[r.rating]++;
      if (r.attributes) {
        attrSums.fit += r.attributes.fit || 5;
        attrSums.quality += r.attributes.quality || 5;
        attrSums.comfort += r.attributes.comfort || 5;
        attrSums.material += r.attributes.material || 5;
        attrSums.colorAccuracy += r.attributes.colorAccuracy || 5;
      }
    });

    const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 0;
    const attributeAverages = {
      fit: totalReviews > 0 ? Number((attrSums.fit / totalReviews).toFixed(1)) : 5,
      quality: totalReviews > 0 ? Number((attrSums.quality / totalReviews).toFixed(1)) : 5,
      comfort: totalReviews > 0 ? Number((attrSums.comfort / totalReviews).toFixed(1)) : 5,
      material: totalReviews > 0 ? Number((attrSums.material / totalReviews).toFixed(1)) : 5,
      colorAccuracy: totalReviews > 0 ? Number((attrSums.colorAccuracy / totalReviews).toFixed(1)) : 5
    };

    res.json({
      success: true,
      reviews,
      stats: {
        averageRating,
        totalReviews,
        ratingCounts,
        attributeAverages
      }
    });
  } catch (error) {
    console.error("Get Product Reviews Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get User Eligible Reviews (User's delivered items and reviewed state)
const getUserEligibleReviews = async (req, res) => {
  try {
    const { userId } = req.body;
    const userReviews = await reviewModel.find({ userId });
    const reviewedKeys = new Set(userReviews.map(r => `${r.orderId}_${r.productId}`));

    res.json({
      success: true,
      reviewedKeys: Array.from(reviewedKeys)
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Admin: Get All Reviews
const adminGetAllReviews = async (req, res) => {
  try {
    const reviews = await reviewModel.find({}).sort({ date: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Admin: Toggle Hide/Show Review
const adminToggleHideReview = async (req, res) => {
  try {
    const { reviewId } = req.body;
    const review = await reviewModel.findById(reviewId);
    if (!review) {
      return res.json({ success: false, message: "Review not found" });
    }

    review.hidden = !review.hidden;
    await review.save();

    // Recalculate product rating aggregates
    await updateProductRatingStats(review.productId);

    res.json({
      success: true,
      message: `Review ${review.hidden ? 'hidden' : 'unhidden'} successfully.`,
      hidden: review.hidden
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export {
  addReview,
  getProductReviews,
  getUserEligibleReviews,
  adminGetAllReviews,
  adminToggleHideReview
};
