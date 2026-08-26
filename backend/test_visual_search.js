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

// 1x1 transparent pixel base64 sample
const sampleBase64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function testVisualSearch() {
  console.log('==================================================');
  console.log('      TESTING STRICT VISUAL SEARCH RELEVANCE      ');
  console.log('==================================================\n');

  await connectDB();
  console.log('MongoDB Connected.\n');

  const { req, res, getResult } = createMockReqRes({ image: sampleBase64Image });
  await visualSearch(req, res);
  const result = getResult().data;

  console.log('Result Success:', result?.success);
  console.log('Detected Specs:', result?.detectedSpecs);
  console.log('Total Matches Returned:', (result?.products || []).length);
  
  const returnedSubCategories = (result?.products || []).map(p => `${p.name} -> [${p.subCategory}]`);
  console.log('Returned Products & SubCategories:\n', returnedSubCategories);

  // Check that NO non-Topwear items were returned if primarySubCategory is Topwear!
  const hasContradictingItems = (result?.products || []).some(p => p.subCategory === 'Footwear' || p.subCategory === 'Bottomwear' || p.subCategory === 'Accessories');

  if (!hasContradictingItems) {
    console.log('\n✅ VISUAL SEARCH RELEVANCE TEST PASSED: No unrelated product subcategories returned!');
  } else {
    console.log('\n❌ VISUAL SEARCH TEST FAILED: Unrelated subcategories returned.');
    process.exit(1);
  }

  process.exit(0);
}

testVisualSearch();
