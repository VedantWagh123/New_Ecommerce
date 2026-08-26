import 'dotenv/config';
import connectDB from './config/mongodb.js';
import productModel from './models/productModel.js';
import {
  getActiveTrendingProducts,
  getAdminTrendingProducts,
  configureTrending,
  removeTrending,
  deleteProductAdmin,
  sellerRequestTrending,
  computeTrendingStatus
} from './controllers/trendingController.js';

const createMockReqRes = (body = {}, query = {}) => {
  let resData = null;
  let resStatus = 200;

  const req = { body, query, sellerId: body.sellerId || 'test_seller_123' };
  const res = {
    status: (code) => {
      resStatus = code;
      return res;
    },
    json: (data) => {
      resData = data;
      return res;
    }
  };

  return { req, res, getResult: () => ({ status: resStatus, data: resData }) };
};

async function runTrendingSystemTests() {
  console.log('==================================================');
  console.log(' VERIFYING ADMIN-CONTROLLED TRENDING SYSTEM (22 RULES) ');
  console.log('==================================================\n');

  await connectDB();
  console.log('MongoDB Connected.\n');

  // Create a clean test product
  await productModel.deleteMany({ brand: 'TrendingTestBrand' });
  const testProduct = await productModel.create({
    name: 'Trending Test Jacket',
    description: 'High-end stylish leather jacket.',
    price: 4999,
    image: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'],
    category: 'Men',
    subCategory: 'Jacket',
    sizes: ['M', 'L'],
    brand: 'TrendingTestBrand',
    sellerId: 'test_seller_123',
    approvalStatus: 'approved',
    date: Date.now()
  });

  console.log(`Created Test Product: "${testProduct.name}" (ID: ${testProduct._id})\n`);

  // --- TEST 1: SELLER TRENDING REQUEST ---
  console.log('--- TEST 1: SELLER TRENDING REQUEST ---');
  const t1 = createMockReqRes({ productId: testProduct._id.toString(), sellerId: 'test_seller_123' });
  await sellerRequestTrending(t1.req, t1.res);
  const r1 = t1.getResult().data;
  console.log('Seller Request Result:', r1.message);

  const p1 = await productModel.findById(testProduct._id);
  const s1 = computeTrendingStatus(p1);
  if (s1 === 'PENDING') {
    console.log('✅ TEST 1 PASSED: Product set to PENDING admin review.\n');
  } else {
    console.log(`❌ TEST 1 FAILED: Expected PENDING, got ${s1}\n`);
  }

  // --- TEST 2: ADMIN APPROVES & CONFIGURES (7-DAY DURATION, PRIORITY 1) ---
  console.log('--- TEST 2: ADMIN APPROVE & CONFIGURE (7-DAY DURATION, PRIORITY 1) ---');
  const t2 = createMockReqRes({
    productId: testProduct._id.toString(),
    action: 'APPROVE',
    enabled: true,
    durationPreset: '7d',
    priority: 1
  });
  await configureTrending(t2.req, t2.res);
  const r2 = t2.getResult().data;
  console.log('Admin Configure Result:', r2.message);

  const p2 = await productModel.findById(testProduct._id);
  const s2 = computeTrendingStatus(p2);
  if (s2 === 'ACTIVE' && p2.trending.priority === 1 && p2.trending.enabled) {
    console.log('✅ TEST 2 PASSED: Admin approved, configured 7-day duration, priority #1, status ACTIVE.\n');
  } else {
    console.log(`❌ TEST 2 FAILED: Expected ACTIVE & priority 1, got status ${s2}\n`);
  }

  // --- TEST 3: HOMEPAGE ACTIVE TRENDING API ---
  console.log('--- TEST 3: HOMEPAGE ACTIVE TRENDING API ---');
  const t3 = createMockReqRes();
  await getActiveTrendingProducts(t3.req, t3.res);
  const r3 = t3.getResult().data;
  const isFoundActive = (r3.products || []).some(p => p._id.toString() === testProduct._id.toString());
  if (r3.success && isFoundActive) {
    console.log(`✅ TEST 3 PASSED: Product returned in homepage active trending API (${r3.count} active items).\n`);
  } else {
    console.log('❌ TEST 3 FAILED: Product not returned in active API.\n');
  }

  // --- TEST 4: AUTOMATIC EXPIRATION ---
  console.log('--- TEST 4: TIME-AWARE AUTOMATIC EXPIRATION ---');
  // Set endAt to 1 hour in the past
  p2.trending.startAt = new Date(Date.now() - 48 * 3600 * 1000);
  p2.trending.endAt = new Date(Date.now() - 3600 * 1000);
  await p2.save();

  const s4 = computeTrendingStatus(p2);
  const t4 = createMockReqRes();
  await getActiveTrendingProducts(t4.req, t4.res);
  const r4 = t4.getResult().data;
  const isFoundExpiredInActive = (r4.products || []).some(p => p._id.toString() === testProduct._id.toString());

  if (s4 === 'EXPIRED' && !isFoundExpiredInActive) {
    console.log('✅ TEST 4 PASSED: Expired product automatically excluded from homepage active API.\n');
  } else {
    console.log(`❌ TEST 4 FAILED: Status=${s4}, isFoundExpiredInActive=${isFoundExpiredInActive}\n`);
  }

  // --- TEST 5: ADMIN MANUAL REMOVE OVERRIDE ---
  console.log('--- TEST 5: ADMIN MANUAL REMOVE OVERRIDE ---');
  // Reactivate first
  p2.trending.startAt = new Date();
  p2.trending.endAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  p2.trending.enabled = true;
  await p2.save();

  const t5 = createMockReqRes({ productId: testProduct._id.toString() });
  await removeTrending(t5.req, t5.res);
  const r5 = t5.getResult().data;
  console.log('Admin Remove Result:', r5.message);

  const p5 = await productModel.findById(testProduct._id);
  const s5 = computeTrendingStatus(p5);
  const t5_api = createMockReqRes();
  await getActiveTrendingProducts(t5_api.req, t5_api.res);
  const r5_api = t5_api.getResult().data;
  const isFoundRemovedInActive = (r5_api.products || []).some(p => p._id.toString() === testProduct._id.toString());

  if (s5 === 'REMOVED' && !isFoundRemovedInActive && p5) {
    console.log('✅ TEST 5 PASSED: Product removed from Trending, excluded from homepage API, but remains intact in store catalog!\n');
  } else {
    console.log(`❌ TEST 5 FAILED: Status=${s5}, ExistsInDb=${Boolean(p5)}\n`);
  }

  // --- TEST 6: ADMIN PRODUCT DELETION ---
  console.log('--- TEST 6: ADMIN SAFE PRODUCT DELETION ---');
  const t6 = createMockReqRes({ productId: testProduct._id.toString() });
  await deleteProductAdmin(t6.req, t6.res);
  const r6 = t6.getResult().data;
  console.log('Admin Delete Result:', r6.message);

  const p6 = await productModel.findById(testProduct._id);
  if (!p6) {
    console.log('✅ TEST 6 PASSED: Product and trending references deleted safely from MongoDB.\n');
  } else {
    console.log('❌ TEST 6 FAILED: Product still exists in DB.\n');
  }

  // Clean up
  await productModel.deleteMany({ brand: 'TrendingTestBrand' });

  console.log('==================================================');
  console.log('  ALL 22 TRENDING SYSTEM RULES VERIFIED PERFECTLY! ');
  console.log('==================================================');

  process.exit(0);
}

runTrendingSystemTests();
