import 'dotenv/config';
import connectDB from './config/mongodb.js';
import userModel from './models/userModel.js';
import productModel from './models/productModel.js';
import { aiChat } from './controllers/aiController.js';

const createMockReqRes = (body, userId = null) => {
  let resData = null;
  let resStatus = 200;

  const req = {
    body: { ...body, userId }
  };

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

async function runTests() {
  console.log('==================================================');
  console.log('  VERIFYING AI IMAGE GENERATION & WISHLIST AGENT  ');
  console.log('==================================================\n');

  await connectDB();
  console.log('MongoDB Connected.\n');

  // Create or retrieve test user in MongoDB
  let testUser = await userModel.findOne({ email: 'wishlist_test@example.com' });
  if (!testUser) {
    testUser = await userModel.create({
      name: 'Wishlist Tester',
      email: 'wishlist_test@example.com',
      password: 'hashedpassword123',
      wishlist: []
    });
  } else {
    testUser.wishlist = [];
    await testUser.save();
  }

  // Insert 2 test products into MongoDB with full schema attributes
  await productModel.deleteMany({ brand: 'WishlistTestBrand' });
  const p1 = await productModel.create({
    name: 'Silk Party Dress',
    description: 'Elegant silk party dress for evening events.',
    price: 2500,
    image: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500'],
    category: 'Women',
    subCategory: 'Dress',
    sizes: ['S', 'M', 'L'],
    brand: 'WishlistTestBrand',
    averageRating: 4.8,
    bestseller: true,
    date: Date.now()
  });

  const p2 = await productModel.create({
    name: 'Casual Denim Jacket',
    description: 'Heavy denim jacket for casual winter wear.',
    price: 1999,
    image: ['https://images.unsplash.com/photo-1542272604-780c96856592?w=500'],
    category: 'Men',
    subCategory: 'Jacket',
    sizes: ['M', 'L', 'XL'],
    brand: 'WishlistTestBrand',
    averageRating: 4.2,
    bestseller: false,
    date: Date.now()
  });

  console.log('--- TEST 1: STORE SEARCH VS IMAGE GENERATION ---');

  // Scenario A: "Show me a black shirt"
  const t1a = createMockReqRes({ prompt: 'Show me a black shirt' });
  await aiChat(t1a.req, t1a.res);
  const r1a = t1a.getResult().data;
  console.log('Query: "Show me a black shirt" -> Intent:', r1a?.intent, '| Is Concept:', Boolean(r1a?.isAiGeneratedConcept));

  // Scenario B: "Generate an image of a black futuristic shirt"
  const t1b = createMockReqRes({ prompt: 'Generate an image of a black futuristic shirt' });
  await aiChat(t1b.req, t1b.res);
  const r1b = t1b.getResult().data;
  console.log('Query: "Generate an image of a black futuristic shirt" -> Intent:', r1b?.intent, '| Is Concept:', Boolean(r1b?.isAiGeneratedConcept));
  console.log('Concept Note:', r1b?.conceptData?.note);

  if (r1a?.intent === 'PRODUCT_SEARCH' && !r1a?.isAiGeneratedConcept && r1b?.intent === 'IMAGE_GENERATION' && r1b?.isAiGeneratedConcept) {
    console.log('✅ TEST 1 PASSED: Strict separation between Store Search and AI Image Generation.\n');
  } else {
    console.log('❌ TEST 1 FAILED\n');
  }

  console.log('--- TEST 2: AI WISHLIST AGENT OPERATIONS ---');

  // Scenario A: Add product to wishlist
  const t2a = createMockReqRes({ prompt: 'Save this to my wishlist', recentProducts: [p1] }, testUser._id);
  await aiChat(t2a.req, t2a.res);
  const r2a = t2a.getResult().data;
  console.log('Add Reply:', r2a?.reply);

  // Verify duplicate prevention
  const t2a_dup = createMockReqRes({ prompt: 'Save this to my wishlist', recentProducts: [p1] }, testUser._id);
  await aiChat(t2a_dup.req, t2a_dup.res);
  const r2a_dup = t2a_dup.getResult().data;
  console.log('Duplicate Add Reply:', r2a_dup?.reply);

  // Add 2nd product to wishlist
  const t2b = createMockReqRes({ prompt: 'Add Casual Denim Jacket to my wishlist', recentProducts: [p2] }, testUser._id);
  await aiChat(t2b.req, t2b.res);

  // Scenario B: Show my wishlist
  const t2c = createMockReqRes({ prompt: "What's in my wishlist?" }, testUser._id);
  await aiChat(t2c.req, t2c.res);
  const r2c = t2c.getResult().data;
  console.log('Wishlist View Reply:', r2c?.reply);
  console.log('Wishlist Items Count:', (r2c?.recommendedProducts || []).length);

  // Scenario C: Which product in my wishlist is best?
  const t2d = createMockReqRes({ prompt: 'Which product in my wishlist is best?' }, testUser._id);
  await aiChat(t2d.req, t2d.res);
  const r2d = t2d.getResult().data;
  console.log('Best Product Reply:', r2d?.reply);

  // Scenario D: Compare my wishlist products
  const t2e = createMockReqRes({ prompt: 'Compare my wishlist products' }, testUser._id);
  await aiChat(t2e.req, t2e.res);
  const r2e = t2e.getResult().data;
  console.log('Compare Wishlist Reply:', r2e?.reply);

  // Scenario E: Remove from wishlist
  const t2f = createMockReqRes({ prompt: 'Remove Casual Denim Jacket from my wishlist', recentProducts: [p2] }, testUser._id);
  await aiChat(t2f.req, t2f.res);
  const r2f = t2f.getResult().data;
  console.log('Remove Reply:', r2f?.reply);

  // Clean up test data
  await productModel.deleteMany({ brand: 'WishlistTestBrand' });
  await userModel.deleteOne({ email: 'wishlist_test@example.com' });

  if (r2a?.reply.toLowerCase().includes('saved') && r2a_dup?.reply.toLowerCase().includes('already') && (r2c?.recommendedProducts || []).length === 2 && r2d?.reply.includes('Silk Party Dress') && r2f?.reply.includes('Removed')) {
    console.log('✅ TEST 2 PASSED: All AI Wishlist Agent operations executed perfectly on MongoDB.\n');
  } else {
    console.log('❌ TEST 2 FAILED\n');
  }

  process.exit(0);
}

runTests();
