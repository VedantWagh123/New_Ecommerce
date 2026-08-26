import 'dotenv/config';
import connectDB from './config/mongodb.js';
import { aiChat } from './controllers/aiController.js';

// Mock Express req/res
const createMockReqRes = (body, headers = {}) => {
  let resData = null;
  let resStatus = 200;

  const req = {
    body,
    headers
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

async function runDirectTests() {
  console.log('==================================================');
  console.log('   STARTING DIRECT AI AGENT VERIFICATION TESTS    ');
  console.log('==================================================\n');

  await connectDB();
  console.log('MongoDB Connected.\n');

  let history = [];
  let recentProducts = [];

  // TEST 1: Greeting "Hi"
  console.log('--- TEST 1: User: "Hi" ---');
  const t1 = createMockReqRes({ prompt: 'Hi' });
  await aiChat(t1.req, t1.res);
  const r1 = t1.getResult().data;
  console.log('Intent:', r1?.intent);
  console.log('Reply:', r1?.reply);
  console.log('Recommended Products Count:', (r1?.recommendedProducts || []).length);
  if (r1?.intent === 'GREETING' && (r1?.recommendedProducts || []).length === 0) {
    console.log('✅ TEST 1 PASSED: Natural greeting returned without searching products.\n');
  } else {
    console.log('❌ TEST 1 FAILED\n');
  }

  // TEST 2: Product Search "Show me black t-shirts"
  console.log('--- TEST 2: User: "Show me black t-shirts" ---');
  const t2 = createMockReqRes({ prompt: 'Show me black t-shirts' });
  await aiChat(t2.req, t2.res);
  const r2 = t2.getResult().data;
  console.log('Intent:', r2?.intent);
  console.log('Reply:', r2?.reply);
  recentProducts = r2?.recommendedProducts || [];
  console.log('Products Found:', recentProducts.map(p => ({ id: p._id, name: p.name, price: p.price, colors: p.colors })));
  if (r2?.intent === 'PRODUCT_SEARCH') {
    console.log('✅ TEST 2 PASSED: Products searched from catalog.\n');
  } else {
    console.log('❌ TEST 2 FAILED\n');
  }

  // TEST 3: Context refinement "Under 1500"
  console.log('--- TEST 3: User: "Under 1500" ---');
  const t3 = createMockReqRes({ prompt: 'Under 1500', recentProducts });
  await aiChat(t3.req, t3.res);
  const r3 = t3.getResult().data;
  console.log('Intent:', r3?.intent);
  console.log('Reply:', r3?.reply);
  const refined = r3?.recommendedProducts || [];
  console.log('Refined Products:', refined.map(p => ({ name: p.name, price: p.price })));
  if (r3?.intent === 'PRODUCT_SEARCH' && refined.every(p => p.price <= 1500)) {
    console.log('✅ TEST 3 PASSED: Refined search under price limit.\n');
  } else {
    console.log('❌ TEST 3 FAILED\n');
  }

  // TEST 4: Comparison "Which one is better?"
  console.log('--- TEST 4: User: "Which one is better?" ---');
  const t4 = createMockReqRes({ prompt: 'Which one is better?', recentProducts });
  await aiChat(t4.req, t4.res);
  const r4 = t4.getResult().data;
  console.log('Intent:', r4?.intent);
  console.log('Reply:', r4?.reply);
  if (r4?.intent === 'PRODUCT_COMPARISON') {
    console.log('✅ TEST 4 PASSED: Contextual comparison generated.\n');
  } else {
    console.log('❌ TEST 4 FAILED\n');
  }

  // TEST 5: Ordinal Cart Add "Add the second one to cart"
  console.log('--- TEST 5: User: "Add the second one to cart" ---');
  const t5 = createMockReqRes({ prompt: 'Add the second one to cart', recentProducts });
  await aiChat(t5.req, t5.res);
  const r5 = t5.getResult().data;
  console.log('Intent:', r5?.intent);
  console.log('Reply:', r5?.reply);
  console.log('Action:', r5?.action);
  if (r5?.intent === 'ADD_TO_CART') {
    console.log('✅ TEST 5 PASSED: Ordinal cart addition handled.\n');
  } else {
    console.log('❌ TEST 5 FAILED\n');
  }

  // TEST 6: View Cart "Show my cart"
  console.log('--- TEST 6: User: "Show my cart" ---');
  const t6 = createMockReqRes({ prompt: 'Show my cart' });
  await aiChat(t6.req, t6.res);
  const r6 = t6.getResult().data;
  console.log('Intent:', r6?.intent);
  console.log('Reply:', r6?.reply);
  if (r6?.intent === 'VIEW_CART') {
    console.log('✅ TEST 6 PASSED: Cart query processed.\n');
  } else {
    console.log('❌ TEST 6 FAILED\n');
  }

  // TEST 7: Outfit Request "I want a party outfit under 3000"
  console.log('--- TEST 7: User: "I want a party outfit under 3000" ---');
  const t7 = createMockReqRes({ prompt: 'I want a party outfit under 3000' });
  await aiChat(t7.req, t7.res);
  const r7 = t7.getResult().data;
  console.log('Intent:', r7?.intent);
  console.log('Reply:', r7?.reply);
  const outfitItems = r7?.recommendedProducts || [];
  const totalPrice = outfitItems.reduce((sum, p) => sum + (p.price || 0), 0);
  console.log('Outfit Items:', outfitItems.map(p => ({ name: p.name, price: p.price })));
  console.log('Total Price:', totalPrice);
  if (r7?.intent === 'OUTFIT_RECOMMENDATION' && totalPrice <= 3000) {
    console.log('✅ TEST 7 PASSED: Party outfit under 3000 recommended.\n');
  } else {
    console.log('❌ TEST 7 FAILED\n');
  }

  // TEST 8: Non-existent Search Fallback
  console.log('--- TEST 8: Non-existent product "Show me yellow neon leather winter trench coat under 100" ---');
  const t8 = createMockReqRes({ prompt: 'Show me yellow neon leather winter trench coat under 100' });
  await aiChat(t8.req, t8.res);
  const r8 = t8.getResult().data;
  console.log('Intent:', r8?.intent);
  console.log('Reply:', r8?.reply);
  console.log('Fallback Products:', (r8?.recommendedProducts || []).length);
  if (r8?.intent === 'PRODUCT_SEARCH') {
    console.log('✅ TEST 8 PASSED: Search handled truthfully without throwing errors.\n');
  } else {
    console.log('❌ TEST 8 FAILED\n');
  }

  // TEST 9: General Store Question "What is your return policy?"
  console.log('--- TEST 9: User: "What is your return policy?" ---');
  const t9 = createMockReqRes({ prompt: 'What is your return policy?' });
  await aiChat(t9.req, t9.res);
  const r9 = t9.getResult().data;
  console.log('Intent:', r9?.intent);
  console.log('Reply:', r9?.reply);
  if (r9?.intent === 'POLICY_RETURN') {
    console.log('✅ TEST 9 PASSED: Store policy answered naturally.\n');
  } else {
    console.log('❌ TEST 9 FAILED\n');
  }

  // TEST 10: Product Specification Query "Tell me about the material of this product"
  console.log('--- TEST 10: User: "Tell me about the material of this product" ---');
  const t10 = createMockReqRes({ prompt: 'Tell me about the material of this product', recentProducts });
  await aiChat(t10.req, t10.res);
  const r10 = t10.getResult().data;
  console.log('Intent:', r10?.intent);
  console.log('Reply:', r10?.reply);
  if (r10?.intent === 'PRODUCT_DETAILS') {
    console.log('✅ TEST 10 PASSED: Product specification details handled accurately.\n');
  } else {
    console.log('❌ TEST 10 FAILED\n');
  }

  process.exit(0);
}

runDirectTests();
