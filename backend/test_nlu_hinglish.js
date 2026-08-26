import 'dotenv/config';
import connectDB from './config/mongodb.js';
import { aiChat } from './controllers/aiController.js';

const createMockReqRes = (body) => {
  let resData = null;
  let resStatus = 200;

  const req = { body };
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

async function runNluTests() {
  console.log('==================================================');
  console.log('   VERIFYING COMPREHENSIVE HINGLISH & NLU ENGINE   ');
  console.log('==================================================\n');

  await connectDB();
  console.log('MongoDB Connected.\n');

  const testCases = [
    { prompt: 'kya haal hai bhai', expectedIntent: 'GREETING' },
    { prompt: 'kaise ho ji', expectedIntent: 'CASUAL_CONVERSATION' },
    { prompt: 'kaala t shirt dikhao 1500 ke under', expectedIntent: 'PRODUCT_SEARCH' },
    { prompt: 'pant chahiye', expectedIntent: 'PRODUCT_SEARCH' },
    { prompt: 'party me kya pehnu 3000 tak', expectedIntent: 'OUTFIT_RECOMMENDATION' },
    { prompt: 'doosra wala cart me daal', expectedIntent: 'ADD_TO_CART' },
    { prompt: 'cart dikha', expectedIntent: 'VIEW_CART' },
    { prompt: 'wishlist me daal ye product', expectedIntent: 'WISHLIST_ADD' },
    { prompt: 'saman kab aayega order status dikha', expectedIntent: 'ORDER_STATUS' },
    { prompt: 'wapas kar sakte hai kya', expectedIntent: 'POLICY_RETURN' },
    { prompt: 'delivery kitne me hogi', expectedIntent: 'POLICY_SHIPPING' },
    { prompt: 'black hoodie ki image bana', expectedIntent: 'IMAGE_GENERATION' }
  ];

  let passed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const { prompt, expectedIntent } = testCases[i];
    const t = createMockReqRes({ prompt });
    await aiChat(t.req, t.res);
    const data = t.getResult().data;

    const isMatch = data?.intent === expectedIntent;
    if (isMatch) {
      console.log(`[PASS] Input: "${prompt}" -> Intent: ${data?.intent}`);
      passed++;
    } else {
      console.log(`[FAIL] Input: "${prompt}" -> Got: ${data?.intent} | Expected: ${expectedIntent}`);
    }
  }

  console.log(`\n==================================================`);
  console.log(`   NLU TEST RESULTS: ${passed}/${testCases.length} PASSED`);
  console.log(`==================================================`);

  process.exit(passed === testCases.length ? 0 : 1);
}

runNluTests();
