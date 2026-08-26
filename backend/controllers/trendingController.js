import mongoose from 'mongoose';
import productModel from '../models/productModel.js';
import userModel from '../models/userModel.js';

// Helper to compute runtime status of a product's trending configuration
export const computeTrendingStatus = (p, now = new Date()) => {
  const t = p.trending || {};
  if (t.status === 'REJECTED') return 'REJECTED';
  if (t.status === 'PENDING') return 'PENDING';
  if (t.status === 'REMOVED' || !t.enabled) return 'REMOVED';

  if (t.enabled) {
    const start = t.startAt ? new Date(t.startAt) : null;
    const end = t.endAt ? new Date(t.endAt) : null;

    if (start && start > now) return 'SCHEDULED';
    if (end && end <= now) return 'EXPIRED';
    return 'ACTIVE';
  }

  return 'NONE';
};

// Helper to enrich product list with storeName & dynamic trending status
const enrichTrendingProducts = async (products) => {
  if (!Array.isArray(products)) return [];
  const validSellerIds = [...new Set(products.map(p => p.sellerId).filter(p => p && mongoose.Types.ObjectId.isValid(p)))];
  const sellers = validSellerIds.length > 0 ? await userModel.find({ _id: { $in: validSellerIds } }).select('_id storeName email name') : [];
  const sellerMap = {};
  sellers.forEach(s => {
    sellerMap[s._id.toString()] = s.storeName || s.name || s.email;
  });

  const now = new Date();

  return products.map(p => {
    const obj = p.toObject ? p.toObject() : { ...p };
    obj.storeName = p.sellerId && sellerMap[p.sellerId.toString()] ? sellerMap[p.sellerId.toString()] : 'Veloura Official';
    obj.computedTrendingStatus = computeTrendingStatus(obj, now);
    return obj;
  });
};

/**
 * 1. Customer Public API: Get Active Trending Products
 * Strict time-aware filtering:
 * - Product approved/published
 * - trending.enabled === true
 * - startAt <= now (or startAt null)
 * - endAt > now (or endAt null)
 * Sorted by priority ASC (Priority 1 first), then approvedAt DESC
 */
export const getActiveTrendingProducts = async (req, res) => {
  try {
    const now = new Date();

    const dbProducts = await productModel.find({
      $and: [
        {
          $or: [
            { approvalStatus: 'approved' },
            { approvalStatus: { $exists: false } },
            { approvalStatus: null }
          ]
        },
        { 'trending.enabled': true },
        {
          $or: [
            { 'trending.startAt': { $lte: now } },
            { 'trending.startAt': null }
          ]
        },
        {
          $or: [
            { 'trending.endAt': { $gt: now } },
            { 'trending.endAt': null }
          ]
        }
      ]
    }).sort({ 'trending.priority': 1, 'trending.approvedAt': -1, date: -1 });

    const enriched = await enrichTrendingProducts(dbProducts);
    // Double check time-aware active filter
    const activeProducts = enriched.filter(p => p.computedTrendingStatus === 'ACTIVE');

    res.json({ success: true, count: activeProducts.length, products: activeProducts });
  } catch (error) {
    console.error('getActiveTrendingProducts Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. Admin API: Get All Products for Trending Management
 * Categorized by status & filter tab
 */
export const getAdminTrendingProducts = async (req, res) => {
  try {
    const { statusFilter = 'ALL', search = '' } = req.query;
    const now = new Date();

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { subCategory: { $regex: search, $options: 'i' } }
      ];
    }

    const allDbProducts = await productModel.find(query).sort({ date: -1 });
    const enriched = await enrichTrendingProducts(allDbProducts);

    // Compute summary stats
    const stats = {
      active: enriched.filter(p => p.computedTrendingStatus === 'ACTIVE').length,
      scheduled: enriched.filter(p => p.computedTrendingStatus === 'SCHEDULED').length,
      pending: enriched.filter(p => p.computedTrendingStatus === 'PENDING').length,
      expired: enriched.filter(p => p.computedTrendingStatus === 'EXPIRED').length,
      removed: enriched.filter(p => p.computedTrendingStatus === 'REMOVED').length,
      total: enriched.length
    };

    let filtered = enriched;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'TRENDING_ONLY') {
        filtered = enriched.filter(p => ['ACTIVE', 'SCHEDULED', 'PENDING', 'EXPIRED'].includes(p.computedTrendingStatus));
      } else {
        filtered = enriched.filter(p => p.computedTrendingStatus === statusFilter);
      }
    }

    res.json({ success: true, stats, products: filtered });
  } catch (error) {
    console.error('getAdminTrendingProducts Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Admin API: Configure Trending for a Product
 * Set enabled, duration (preset or custom), startAt, endAt, priority, approve/reject
 */
export const configureTrending = async (req, res) => {
  try {
    const {
      productId,
      action = 'CONFIGURE', // 'APPROVE', 'REJECT', 'CONFIGURE', 'DISABLE'
      enabled = true,
      durationPreset = '7d', // '24h', '3d', '7d', '14d', '30d', 'custom'
      customStartAt = null,
      customEndAt = null,
      priority = 1,
      rejectionReason = ''
    } = req.body;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const now = new Date();
    let start = now;
    let end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // default 7 days

    if (durationPreset === '24h') {
      start = now;
      end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (durationPreset === '3d') {
      start = now;
      end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    } else if (durationPreset === '7d') {
      start = now;
      end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (durationPreset === '14d') {
      start = now;
      end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    } else if (durationPreset === '30d') {
      start = now;
      end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (durationPreset === 'custom') {
      start = customStartAt ? new Date(customStartAt) : now;
      end = customEndAt ? new Date(customEndAt) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    let updatedTrending = { ...product.trending };

    if (action === 'REJECT') {
      updatedTrending = {
        ...updatedTrending,
        enabled: false,
        status: 'REJECTED',
        rejectedAt: now,
        rejectionReason: rejectionReason || 'Does not qualify for homepage trending placement.'
      };
    } else {
      updatedTrending = {
        ...updatedTrending,
        enabled: Boolean(enabled),
        status: enabled ? (start > now ? 'SCHEDULED' : 'ACTIVE') : 'REMOVED',
        startAt: start,
        endAt: end,
        priority: Number(priority) || 1,
        approvedAt: now,
        removedAt: enabled ? null : now
      };
    }

    product.trending = updatedTrending;
    await product.save();

    const [enriched] = await enrichTrendingProducts([product]);

    res.json({
      success: true,
      message: action === 'REJECT' ? `Trending request for "${product.name}" rejected.` : `Trending configuration saved for "${product.name}".`,
      product: enriched
    });
  } catch (error) {
    console.error('configureTrending Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Admin API: Remove from Trending (Deactivate Trending without deleting product)
 */
export const removeTrending = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.trending = {
      ...product.trending,
      enabled: false,
      status: 'REMOVED',
      removedAt: new Date()
    };

    await product.save();
    const [enriched] = await enrichTrendingProducts([product]);

    res.json({
      success: true,
      message: `"${product.name}" removed from Trending. Product remains in store catalog.`,
      product: enriched
    });
  } catch (error) {
    console.error('removeTrending Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. Admin API: Safe Product Deletion
 * Deletes product completely and deactivates any trending reference cleanly
 */
export const deleteProductAdmin = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const productName = product.name;
    await productModel.findByIdAndDelete(productId);

    res.json({
      success: true,
      message: `Product "${productName}" and its trending status deleted safely from the system.`
    });
  } catch (error) {
    console.error('deleteProductAdmin Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. Seller API: Request Trending for a Product
 * Seller CANNOT activate directly, set duration, or priority.
 */
export const sellerRequestTrending = async (req, res) => {
  try {
    const { productId } = req.body;
    const sellerId = req.sellerId || req.body.sellerId;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Verify ownership if sellerId is present
    if (sellerId && product.sellerId && String(product.sellerId) !== String(sellerId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this product' });
    }

    if (product.trending && product.trending.status === 'PENDING') {
      return res.json({ success: true, message: 'Trending request is already pending admin approval.' });
    }

    product.trending = {
      ...product.trending,
      enabled: false,
      status: 'PENDING',
      requestedBy: sellerId || product.sellerId,
      requestedAt: new Date()
    };

    await product.save();
    const [enriched] = await enrichTrendingProducts([product]);

    res.json({
      success: true,
      message: `Trending request submitted for "${product.name}". Pending admin review.`,
      product: enriched
    });
  } catch (error) {
    console.error('sellerRequestTrending Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. Seller API: Get Seller's Products & Trending Request Statuses
 */
export const getSellerTrendingRequests = async (req, res) => {
  try {
    const sellerId = req.sellerId || req.query.sellerId;
    if (!sellerId) {
      return res.status(400).json({ success: false, message: 'Seller ID is required' });
    }

    const sellerProducts = await productModel.find({ sellerId }).sort({ date: -1 });
    const enriched = await enrichTrendingProducts(sellerProducts);

    res.json({ success: true, products: enriched });
  } catch (error) {
    console.error('getSellerTrendingRequests Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
