import 'dotenv/config';
import connectDB from './config/mongodb.js';
import { visualSearch } from './controllers/aiController.js';

const createMockReqRes = (body) => {
  let resData = null;
  let resStatus = 200;
  const req = { body };
  const res = {
    status: (code) => { resStatus = code; return res; },
    json: (data) => { resData = data; return res; }
  };
  return { req, res, getResult: () => ({ status: resStatus, data: resData }) };
};

// 1x1 transparent pixel base64 sample representing non-fashion / blank screenshot
const sampleBase64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function testNonFashionImage() {
  console.log('==================================================');
  console.log('  TESTING NON-FASHION IMAGE TRUTHFUL ZERO MATCH   ');
  console.log('==================================================\n');

  await connectDB();
  console.log('MongoDB Connected.\n');

  const { req, res, getResult } = createMockReqRes({ image: sampleBase64Image });
  await visualSearch(req, res);
  const result = getResult().data;

  console.log('Result Success:', result?.success);
  console.log('Is Fashion Item:', result?.isFashionItem);
  console.log('Description:', result?.description);
  console.log('Total Matches Returned:', (result?.products || []).length);

  if (result?.products?.length === 0) {
    console.log('\n✅ TEST PASSED: Non-fashion image returned 0 products truthfully without forced fallbacks!');
  } else {
    console.log('\n❌ TEST FAILED: Products were returned for a non-fashion image.');
    process.exit(1);
  }

  process.exit(0);
}

testNonFashionImage();
