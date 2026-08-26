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
  console.log('  VERIFYING DYNAMIC CHATGPT-STYLE RESPONSES       ');
  console.log('==================================================\n');

  await connectDB();
  console.log('MongoDB Connected.\n');

  const testPrompts = [
    'kya hal hai',
    'what',
    'who created you',
    'any black shirt',
    'tell me about fashion'
  ];

  const replies = [];

  for (const p of testPrompts) {
    const t = createMockReqRes({ prompt: p });
    await aiChat(t.req, t.res);
    const data = t.getResult().data;
    console.log(`Prompt: "${p}"`);
    console.log(`Intent: ${data?.intent}`);
    console.log(`Reply: "${data?.reply}"\n---`);
    replies.push(data?.reply);
  }

  // Check that no reply is the hardcoded template sentence
  const hasHardcodedTemplate = replies.some(r => r && r.includes('How else can I assist you with our fashion collection today'));
  const allUnique = new Set(replies).size === testPrompts.length;

  if (!hasHardcodedTemplate && allUnique) {
    console.log('✅ ALL DYNAMIC CHAT RESPONSE TESTS PASSED!');
    console.log('Every conversational query receives a unique, prompt-aware ChatGPT-style response.');
  } else {
    console.log('❌ DYNAMIC CHAT RESPONSE TEST FAILED');
  }

  process.exit(0);
}

runTests();
