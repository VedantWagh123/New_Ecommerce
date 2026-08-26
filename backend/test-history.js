import axios from 'axios';

async function test() {
  try {
    const response = await axios.post('http://localhost:4000/api/ai/chat', {
      prompt: "Show me black t-shirts",
      conversationHistory: [
        {
          id: 1,
          sender: 'ai',
          text: "Hello! 👋 I'm your Real-Time AI Fashion Stylist & Assistant. Ask me to search our catalog, check order status, compare products, or build an outfit under your budget!"
        }
      ],
      recentProducts: []
    }, { timeout: 65000 });
    
    console.log("SUCCESS:", response.data);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

test();
