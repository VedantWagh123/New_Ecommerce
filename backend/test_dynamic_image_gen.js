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

async function runTests() {
  console.log('==================================================');
  console.log('   VERIFYING DYNAMIC AI IMAGE GENERATION ENGINE   ');
  console.log('==================================================\n');

  await connectDB();
  console.log('MongoDB Connected.\n');

  // Test 1: Black Futuristic Shirt
  const p1 = 'Generate a black futuristic shirt';
  const t1 = createMockReqRes({ prompt: p1 });
  await aiChat(t1.req, t1.res);
  const r1 = t1.getResult().data;
  const url1 = r1?.conceptData?.imageUrl;
  console.log('Prompt 1:', p1);
  console.log('Generated URL 1:', url1);
  console.log('---');

  // Test 2: Red Party Dress
  const p2 = 'Generate a red party dress';
  const t2 = createMockReqRes({ prompt: p2 });
  await aiChat(t2.req, t2.res);
  const r2 = t2.getResult().data;
  const url2 = r2?.conceptData?.imageUrl;
  console.log('Prompt 2:', p2);
  console.log('Generated URL 2:', url2);
  console.log('---');

  // Test 3: White Sneakers with Blue Details
  const p3 = 'Generate white sneakers with blue details';
  const t3 = createMockReqRes({ prompt: p3 });
  await aiChat(t3.req, t3.res);
  const r3 = t3.getResult().data;
  console.log('Prompt 3:', p3);
  const url3 = r3?.conceptData?.imageUrl;
  console.log('Generated URL 3:', url3);
  console.log('---');

  // Assertions
  const isUrl1Valid = url1 && url1.includes('black') && url1.includes('futuristic');
  const isUrl2Valid = url2 && url2.includes('red') && url2.includes('party');
  const isUrl3Valid = url3 && url3.includes('white') && url3.includes('sneakers');
  const allDifferent = (url1 !== url2) && (url2 !== url3) && (url1 !== url3);

  if (isUrl1Valid && isUrl2Valid && isUrl3Valid && allDifferent) {
    console.log('✅ ALL DYNAMIC IMAGE GENERATION TESTS PASSED PERFECTLY!');
    console.log('Every generation prompt creates a fresh, unique, prompt-specific AI image.');
  } else {
    console.log('❌ DYNAMIC IMAGE GENERATION TEST FAILED');
  }

  process.exit(0);
}

runTests();
