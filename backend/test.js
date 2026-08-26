import axios from 'axios';

const TOOLS = [
  {
    name: "searchProducts",
    description: "Search the store catalogue for products based on user criteria. Use this when the user is looking for specific clothes.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query text (e.g. 'black shirt')" },
        category: { type: "string", enum: ["Men", "Women", "Kids"], description: "Target category" },
        subCategory: { type: "string", description: "Target subcategory like Topwear, Bottomwear, etc." },
        color: { type: "string", description: "Color of the product" },
        fit: { type: "string", description: "Fit preference (e.g., Slim, Oversized)" },
        maxPrice: { type: "number", description: "Maximum price budget" }
      }
    }
  }
];

const systemContent = `You are Veloura's Advanced AI Fashion Agent...
AVAILABLE TOOLS:
${JSON.stringify(TOOLS, null, 2)}
`;

const messages = [
  { role: 'system', content: systemContent },
  { role: 'user', content: 'Show me black t-shirts' }
];

async function test() {
  try {
    const chatResponse = await axios.post('http://127.0.0.1:11434/api/chat', {
      model: 'veloura-stylist:latest',
      messages,
      stream: false
    }, { timeout: 60000 });
    console.log("SUCCESS:", chatResponse.data.message.content);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

test();
