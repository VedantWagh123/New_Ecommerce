const axios = require('axios');
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
  },
  {
    name: "getProductDetails",
    description: "Get detailed specifications, materials, and rating for a specific product.",
    parameters: {
      type: "object",
      properties: {
        productRef: { type: "string", description: "The product ID or name to get details for" }
      },
      required: ["productRef"]
    }
  },
  {
    name: "getFashionStylingOutfit",
    description: "Curate a complete 4-piece head-to-toe outfit recommendation for a specific occasion and budget.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["Men", "Women", "Kids"], description: "Gender category" },
        occasion: { type: "string", description: "Occasion (e.g., Casual, Party, College, Office)" },
        fitPreference: { type: "string", description: "Fit preference (e.g., oversized, slim)" },
        maxBudget: { type: "number", description: "Maximum budget for the entire outfit in rupees" }
      },
      required: ["category"]
    }
  },
  {
    name: "addToCart",
    description: "Add a specific single product to the user's shopping cart.",
    parameters: {
      type: "object",
      properties: {
        productRef: { type: "string", description: "The product name or ID to add" },
        size: { type: "string", description: "Size of the product (S, M, L, XL, XXL). Null if not specified." }
      },
      required: ["productRef"]
    }
  },
  {
    name: "addMultipleToCart",
    description: "Add a complete outfit (multiple items) to the user's shopping cart.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "getCart",
    description: "View the user's current shopping cart contents and total price.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "getOrderStatus",
    description: "Track the user's order status and delivery updates.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "generateImageConcept",
    description: "Generate an AI visual concept design for a fashion item. Use this ONLY when the user explicitly asks to CREATE or GENERATE an image.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Description of the clothing item to design visually" }
      },
      required: ["prompt"]
    }
  }
];

const systemContent = You are Veloura's Advanced AI Fashion Agent. You are highly intelligent, friendly, and understand English, Hinglish, and typos.
You have access to tools that query the live MongoDB store catalogue and manage user carts/orders.

AVAILABLE TOOLS:
 + JSON.stringify(TOOLS, null, 2) + 

INSTRUCTIONS:
1. If the user is just saying 'hi' or asking a general question, reply naturally.
2. If you need to search for products, build an outfit, or check the cart/orders, you MUST use one of the tools.
3. To call a tool, output a JSON object in this exact format (and NO other text):
{
  "tool_calls": [
    {
      "name": "searchProducts",
      "arguments": { "query": "black shirt" }
    }
  ]
}
4. NEVER invent or hallucinate products, prices, or inventory. Only mention products returned by your tools.;

axios.post('http://127.0.0.1:11434/api/chat', {
  model: 'veloura-stylist:latest',
  messages: [{ role: 'system', content: systemContent }, { role: 'user', content: 'college outfit under ?3000' }],
  stream: false
}).then(res => console.log(res.data.message.content))
  .catch(err => console.error(err.message));
