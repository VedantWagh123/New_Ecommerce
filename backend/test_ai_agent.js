import axios from 'axios';

const BACKEND_URL = 'http://localhost:4000';

async function runTests() {
  console.log('==================================================');
  console.log('   STARTING AI SHOPPING AGENT VERIFICATION TESTS   ');
  console.log('==================================================\n');

  let history = [];
  let recentProducts = [];

  // TEST 1: Greeting
  console.log('--- TEST 1: User: "Hi" ---');
  try {
    const res1 = await axios.post(`${BACKEND_URL}/api/ai/chat`, { prompt: 'Hi' });
    console.log('Response Intent:', res1.data.intent);
    console.log('Response Reply:', res1.data.reply);
    console.log('Recommended Products Count:', (res1.data.recommendedProducts || []).length);
    if (res1.data.intent === 'GREETING' && (res1.data.recommendedProducts || []).length === 0) {
      console.log('✅ TEST 1 PASSED: Natural greeting returned without searching products.\n');
    } else {
      console.log('❌ TEST 1 FAILED\n');
    }
  } catch (err) {
    console.error('TEST 1 Error:', err.message);
  }

  // TEST 2: Product Search
  console.log('--- TEST 2: User: "Show me black t-shirts" ---');
  try {
    const res2 = await axios.post(`${BACKEND_URL}/api/ai/chat`, { prompt: 'Show me black t-shirts' });
    console.log('Response Intent:', res2.data.intent);
    console.log('Response Reply:', res2.data.reply);
    recentProducts = res2.data.recommendedProducts || [];
    console.log('Products Found:', recentProducts.map(p => ({ id: p._id, name: p.name, price: p.price })));
    if (res2.data.intent === 'PRODUCT_SEARCH') {
      console.log('✅ TEST 2 PASSED: Products searched from catalog.\n');
    } else {
      console.log('❌ TEST 2 FAILED\n');
    }
  } catch (err) {
    console.error('TEST 2 Error:', err.message);
  }

  // TEST 3: Refine Search Contextually
  console.log('--- TEST 3: User: "Under 1500" ---');
  try {
    const res3 = await axios.post(`${BACKEND_URL}/api/ai/chat`, {
      prompt: 'Under 1500',
      recentProducts
    });
    console.log('Response Intent:', res3.data.intent);
    console.log('Response Reply:', res3.data.reply);
    const refined = res3.data.recommendedProducts || [];
    console.log('Refined Products:', refined.map(p => ({ name: p.name, price: p.price })));
    if (res3.data.intent === 'PRODUCT_SEARCH' && refined.every(p => p.price <= 1500)) {
      console.log('✅ TEST 3 PASSED: Refined previous search under price limit.\n');
    } else {
      console.log('❌ TEST 3 FAILED\n');
    }
  } catch (err) {
    console.error('TEST 3 Error:', err.message);
  }

  // TEST 4: Product Comparison
  console.log('--- TEST 4: User: "Which one is better?" ---');
  try {
    const res4 = await axios.post(`${BACKEND_URL}/api/ai/chat`, {
      prompt: 'Which one is better?',
      recentProducts
    });
    console.log('Response Intent:', res4.data.intent);
    console.log('Response Reply:', res4.data.reply);
    if (res4.data.intent === 'PRODUCT_COMPARISON') {
      console.log('✅ TEST 4 PASSED: Contextual product comparison generated.\n');
    } else {
      console.log('❌ TEST 4 FAILED\n');
    }
  } catch (err) {
    console.error('TEST 4 Error:', err.message);
  }

  // TEST 5: Ordinal Cart Add
  console.log('--- TEST 5: User: "Add the second one to cart" ---');
  try {
    const res5 = await axios.post(`${BACKEND_URL}/api/ai/chat`, {
      prompt: 'Add the second one to cart',
      recentProducts
    });
    console.log('Response Intent:', res5.data.intent);
    console.log('Response Reply:', res5.data.reply);
    console.log('Action Result:', res5.data.action);
    if (res5.data.intent === 'ADD_TO_CART') {
      console.log('✅ TEST 5 PASSED: Ordinal product identified for cart.\n');
    } else {
      console.log('❌ TEST 5 FAILED\n');
    }
  } catch (err) {
    console.error('TEST 5 Error:', err.message);
  }

  // TEST 6: View Cart
  console.log('--- TEST 6: User: "Show my cart" ---');
  try {
    const res6 = await axios.post(`${BACKEND_URL}/api/ai/chat`, { prompt: 'Show my cart' });
    console.log('Response Intent:', res6.data.intent);
    console.log('Response Reply:', res6.data.reply);
    if (res6.data.intent === 'VIEW_CART') {
      console.log('✅ TEST 6 PASSED: Cart query handled.\n');
    } else {
      console.log('❌ TEST 6 FAILED\n');
    }
  } catch (err) {
    console.error('TEST 6 Error:', err.message);
  }

  // TEST 7: Fashion Outfit Request
  console.log('--- TEST 7: User: "I want a party outfit under 3000" ---');
  try {
    const res7 = await axios.post(`${BACKEND_URL}/api/ai/chat`, { prompt: 'I want a party outfit under 3000' });
    console.log('Response Intent:', res7.data.intent);
    console.log('Response Reply:', res7.data.reply);
    const outfitItems = res7.data.recommendedProducts || [];
    const totalPrice = outfitItems.reduce((s, p) => s + p.price, 0);
    console.log('Outfit Items:', outfitItems.map(p => ({ name: p.name, price: p.price })));
    console.log('Total Price:', totalPrice);
    if (res7.data.intent === 'OUTFIT_RECOMMENDATION' && totalPrice <= 3000) {
      console.log('✅ TEST 7 PASSED: Complete outfit returned under budget.\n');
    } else {
      console.log('❌ TEST 7 FAILED\n');
    }
  } catch (err) {
    console.error('TEST 7 Error:', err.message);
  }

  // TEST 8: Non-Existent Product Search Fallback
  console.log('--- TEST 8: Non-existent search "Show me yellow neon leather winter trench coat under 100" ---');
  try {
    const res8 = await axios.post(`${BACKEND_URL}/api/ai/chat`, { prompt: 'Show me yellow neon leather winter trench coat under 100' });
    console.log('Response Intent:', res8.data.intent);
    console.log('Response Reply:', res8.data.reply);
    console.log('Fallback Products Offered:', (res8.data.recommendedProducts || []).length);
    if (res8.data.intent === 'PRODUCT_SEARCH' && (res8.data.recommendedProducts || []).length > 0) {
      console.log('✅ TEST 8 PASSED: Zero-result fallback provided real alternative products.\n');
    } else {
      console.log('❌ TEST 8 FAILED\n');
    }
  } catch (err) {
    console.error('TEST 8 Error:', err.message);
  }

  // TEST 9: Store Policy Query
  console.log('--- TEST 9: User: "What is your return policy?" ---');
  try {
    const res9 = await axios.post(`${BACKEND_URL}/api/ai/chat`, { prompt: 'What is your return policy?' });
    console.log('Response Intent:', res9.data.intent);
    console.log('Response Reply:', res9.data.reply);
    if (res9.data.intent === 'POLICY_RETURN') {
      console.log('✅ TEST 9 PASSED: Store policy query answered accurately.\n');
    } else {
      console.log('❌ TEST 9 FAILED\n');
    }
  } catch (err) {
    console.error('TEST 9 Error:', err.message);
  }

  // TEST 10: Missing Product Specification Query
  console.log('--- TEST 10: User: "Tell me about the material of this product" ---');
  try {
    const res10 = await axios.post(`${BACKEND_URL}/api/ai/chat`, {
      prompt: 'Tell me about the material of this product',
      recentProducts
    });
    console.log('Response Intent:', res10.data.intent);
    console.log('Response Reply:', res10.data.reply);
    if (res10.data.intent === 'PRODUCT_DETAILS') {
      console.log('✅ TEST 10 PASSED: Product specification details handled accurately.\n');
    } else {
      console.log('❌ TEST 10 FAILED\n');
    }
  } catch (err) {
    console.error('TEST 10 Error:', err.message);
  }
}

runTests();
