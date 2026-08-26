import 'dotenv/config';
import connectDB from './config/mongodb.js';
import { aiChat } from './controllers/aiController.js';

const createMockReqRes = (body, headers = {}) => {
  let resData = null;
  let resStatus = 200;
  const req = { body, headers };
  const res = {
    status: (code) => { resStatus = code; return res; },
    json: (data) => { resData = data; return res; }
  };
  return { req, res, getResult: () => ({ status: resStatus, data: resData }) };
};

async function testStylistAndCartAgent() {
  console.log('==================================================');
  console.log('  TESTING AI PERSONAL STYLIST & BATCH CART AGENT  ');
  console.log('==================================================\n');

  await connectDB();
  console.log('MongoDB Connected.\n');

  // TEST 1: Head-to-Toe Outfit Request (Age, Occasion, Fit, Budget)
  console.log('--- TEST 1: Request 4-piece Head-to-Toe Outfit ---');
  const t1 = createMockReqRes({
    prompt: 'I am 22 years old college student needing a party outfit oversized fit under 5000'
  });
  await aiChat(t1.req, t1.res);
  const r1 = t1.getResult().data;
  console.log('Intent:', r1?.intent);
  console.log('Reply:', r1?.reply);
  const outfit = r1?.recommendedProducts || [];
  console.log('Outfit Items Count:', outfit.length);
  console.log('Outfit Breakdown:', outfit.map(p => ({ category: p.category, subCategory: p.subCategory, name: p.name, price: p.price })));
  
  if (r1?.intent === 'OUTFIT_RECOMMENDATION' && outfit.length >= 2) {
    console.log('✅ TEST 1 PASSED: Personal Stylist curated outfit.\n');
  } else {
    console.log('❌ TEST 1 FAILED\n');
  }

  // TEST 2: Cart Agent "Ye outfit cart me add kar do"
  console.log('--- TEST 2: Cart Agent "Ye outfit cart me add kar do" ---');
  const t2 = createMockReqRes({
    prompt: 'Ye outfit cart me add kar do',
    recentProducts: outfit
  });
  await aiChat(t2.req, t2.res);
  const r2 = t2.getResult().data;
  console.log('Intent:', r2?.intent);
  console.log('Reply:', r2?.reply);
  console.log('Action Data:', r2?.actionData);

  if (r2?.intent === 'ADD_MULTIPLE_TO_CART') {
    console.log('✅ TEST 2 PASSED: Batch cart addition handled cleanly.\n');
  } else {
    console.log('❌ TEST 2 FAILED\n');
  }

  process.exit(0);
}

testStylistAndCartAgent();
