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

const typoPrompts = [
  "Ye pura outfit card me add kar do",
  "pura outfit ad kr",
  "full outfit cart me dalo",
  "is outfit ko kard me daal",
  "Add complete outfit to cart"
];

async function testTypos() {
  console.log('==================================================');
  console.log('    TESTING FUZZY TYPO & INTENT TOLERANCE        ');
  console.log('==================================================\n');

  await connectDB();
  console.log('MongoDB Connected.\n');

  const mockOutfit = [
    { _id: '6a8ca75d90a027ee95d7f62a', name: 'Item 1', price: 500, sizes: ['S', 'M'] },
    { _id: '6a8c9f4090a027ee95d7f5a4', name: 'Item 2', price: 800, sizes: ['M', 'L'] }
  ];

  for (const prompt of typoPrompts) {
    console.log(`💬 Testing Prompt: "${prompt}"`);
    const t = createMockReqRes({ prompt, recentProducts: mockOutfit });
    await aiChat(t.req, t.res);
    const r = t.getResult().data;
    console.log(`   -> Detected Intent: ${r?.intent}`);
    console.log(`   -> Reply: ${r?.reply}\n`);
    if (r?.intent !== 'ADD_MULTIPLE_TO_CART') {
      console.log(`❌ FAILED for prompt: "${prompt}"`);
      process.exit(1);
    }
  }

  console.log('✅ ALL TYPO & SPELLING VARIATION TESTS PASSED 100%!');
  process.exit(0);
}

testTypos();
