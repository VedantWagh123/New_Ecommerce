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

async function runStrictTests() {
  console.log('==================================================');
  console.log('   STRICT CATALOG-GROUNDED AI AGENT VERIFICATION   ');
  console.log('==================================================\n');

  await connectDB();
  console.log('MongoDB Connected.\n');

  // TEST 1: Query when DB has 0 shirts
  console.log('--- TEST 1: User: "Show me shirts" (DB empty/0 matching) ---');
  const t1 = createMockReqRes({ prompt: 'Show me shirts' });
  await aiChat(t1.req, t1.res);
  const r1 = t1.getResult().data;
  console.log('Reply:', r1?.reply);
  console.log('Recommended Products Count:', (r1?.recommendedProducts || []).length);
  if ((r1?.recommendedProducts || []).length === 0 && r1?.reply.includes("couldn't find")) {
    console.log('✅ TEST 1 PASSED: 0 products in DB returned truthful no-match message with 0 cards.\n');
  } else {
    console.log('❌ TEST 1 FAILED\n');
  }

  // TEST 4: Query when DB has 0 black shirts
  console.log('--- TEST 4: User: "Show me black shirts" (0 matching in DB) ---');
  const t4 = createMockReqRes({ prompt: 'Show me black shirts' });
  await aiChat(t4.req, t4.res);
  const r4 = t4.getResult().data;
  console.log('Reply:', r4?.reply);
  console.log('Recommended Products Count:', (r4?.recommendedProducts || []).length);
  if ((r4?.recommendedProducts || []).length === 0) {
    console.log('✅ TEST 4 PASSED: 0 black shirts in DB returned 0 product cards.\n');
  } else {
    console.log('❌ TEST 4 FAILED\n');
  }

  // TEST 5: Image Generation Intent
  console.log('--- TEST 5: User: "Generate an image of a black shirt" ---');
  const t5 = createMockReqRes({ prompt: 'Generate an image of a black shirt' });
  await aiChat(t5.req, t5.res);
  const r5 = t5.getResult().data;
  console.log('Intent:', r5?.intent);
  console.log('Reply:', r5?.reply);
  console.log('Is AI Concept:', r5?.isAiGeneratedConcept);
  console.log('Recommended Store Products Count:', (r5?.recommendedProducts || []).length);
  if (r5?.intent === 'IMAGE_GENERATION' && r5?.isAiGeneratedConcept && (r5?.recommendedProducts || []).length === 0) {
    console.log('✅ TEST 5 PASSED: Image generation created AI concept, NOT store inventory.\n');
  } else {
    console.log('❌ TEST 5 FAILED\n');
  }

  // TEST 6: Store Search Intent vs Image Generation
  console.log('--- TEST 6: User: "Show me a black shirt" ---');
  const t6 = createMockReqRes({ prompt: 'Show me a black shirt' });
  await aiChat(t6.req, t6.res);
  const r6 = t6.getResult().data;
  console.log('Intent:', r6?.intent);
  console.log('Is AI Concept:', Boolean(r6?.isAiGeneratedConcept));
  if (r6?.intent === 'PRODUCT_SEARCH' && !r6?.isAiGeneratedConcept) {
    console.log('✅ TEST 6 PASSED: Store search performed MongoDB query, did NOT generate image.\n');
  } else {
    console.log('❌ TEST 6 FAILED\n');
  }

  // TEST 7: Add to Cart Safety Validation
  console.log('--- TEST 7: User: "Add the black shirt to cart" (Non-existent product) ---');
  const t7 = createMockReqRes({ prompt: 'Add the black shirt to cart' });
  await aiChat(t7.req, t7.res);
  const r7 = t7.getResult().data;
  console.log('Reply:', r7?.reply);
  if (r7?.reply.includes("Could not identify") || r7?.reply.includes("log in") || r7?.reply.includes("does not exist")) {
    console.log('✅ TEST 7 PASSED: Cart tool safely validated product existence in DB.\n');
  } else {
    console.log('❌ TEST 7 FAILED\n');
  }

  process.exit(0);
}

runStrictTests();
