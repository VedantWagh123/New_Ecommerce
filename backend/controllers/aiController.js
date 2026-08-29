import axios from 'axios';
import jwt from 'jsonwebtoken';
import productModel from '../models/productModel.js';
import {
  searchProducts,
  fallbackSearchProducts,
  getProductDetails,
  compareProducts,
  compareSingleProductPriceTool,
  getFashionStylingOutfit,
  addToCartTool,
  addMultipleToCartTool,
  removeFromCartTool,
  getCartTool,
  toggleWishlistTool,
  addToWishlistTool,
  removeFromWishlistTool,
  getWishlistTool,
  compareWishlistProductsTool,
  getBestWishlistProductTool,
  getOrderStatusTool,
  resolveProductFromContext
} from '../services/aiTools.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llava:latest';
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'llava:latest';

// Helper to safely call Ollama API with configurable timeout
const callOllama = async (endpoint, data, timeoutMs = Number(process.env.OLLAMA_TIMEOUT) || 5000) => {
  return await axios.post(`${OLLAMA_HOST}${endpoint}`, data, { timeout: timeoutMs });
};

// Helper to safely extract user ID from JWT token or request body
const getUserIdFromReq = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.id;
      }
    }
  } catch (e) {
    // Guest user
  }
  return req.body ? req.body.userId : null;
};

// JSON Schema Tool Definitions (Prompt-based)
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

/**
 * Advanced Agentic AI Chat Controller
 * Uses Native LLM Tool Calling to dynamically resolve intents and query MongoDB.
 */
export const aiChat = async (req, res) => {
  try {
    const { prompt, conversationHistory = [], recentProducts = [], overrideModel = null } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const userId = getUserIdFromReq(req);
    const modelToUse = overrideModel || process.env.OLLAMA_MODEL || OLLAMA_MODEL;

    // 1. Construct Agent Memory (System Prompt + Conversation History)
    const systemContent = `You are Veloura's Advanced AI Fashion Agent, a real-time, ChatGPT-like intelligent assistant. You are highly intelligent, friendly, and understand English, Hinglish, and typos.
You have access to tools that query the live MongoDB store catalogue and manage user carts/orders. The store contains hundreds of clothing items (Men, Women, Kids) like shirts, jeans, dresses, jackets, shoes, etc.

AVAILABLE TOOLS:
${JSON.stringify(TOOLS, null, 2)}

INSTRUCTIONS:
1. If the user is just saying 'hi' or asking a general question, reply naturally without calling tools.
2. If you need to search for specific products, build an outfit, or check the cart/orders, you MUST use one of the tools.
3. CONTEXT AWARENESS: Always analyze the conversation history. If the user says "what about red ones?" or "add the first one to cart", use the context from previous messages to figure out what they mean.
4. To call a tool, output a JSON object in this exact format (and NO other text):
{
  "tool_calls": [
    {
      "name": "searchProducts",
      "arguments": { "query": "black shirt" }
    }
  ]
}
5. NEVER invent or hallucinate products, prices, or inventory. Only mention products returned by your tools. Always be helpful, fast, and smart.`;

    const messages = [
      { role: 'system', content: systemContent }
    ];

    // Ensure we don't duplicate the latest prompt if the frontend already appended it
    const lastHistoryMsg = conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1] : null;
    const isPromptInHistory = lastHistoryMsg && lastHistoryMsg.sender === 'user' && lastHistoryMsg.text.trim() === prompt.trim();

    // Append Conversation History for Context (so agent remembers "under 1500" or "black ones")
    for (const msg of conversationHistory) {
      if (msg.sender === 'user') {
        messages.push({ role: 'user', content: msg.text });
      } else if (msg.sender === 'ai' && msg.text) {
        messages.push({ role: 'assistant', content: msg.text });
      }
    }

    // Append current user prompt ONLY if frontend didn't already append it
    if (!isPromptInHistory) {
      messages.push({ role: 'user', content: prompt.trim() });
    }

    // 2. Initial LLM Call: Let the Agent decide which tool to call (via prompt)
    let chatResponse;
    try {
      chatResponse = await callOllama('/api/chat', {
        model: modelToUse,
        messages,
        stream: false
      }, 120000); // 120s timeout for complex tool decision
    } catch (llmErr) {
      console.warn("LLM API Error during tool resolution:", llmErr.message);
      return res.json({
        success: true,
        intent: 'FALLBACK',
        reply: `I'm having a bit of trouble connecting to my AI core. (Error: ${llmErr.message}). Could you please ask that again?`,
        recommendedProducts: [],
      });
    }

    const responseContent = chatResponse.data.message.content;
    let toolCalls = null;

    try {
      let jsonStr = responseContent;
      // Clean up markdown escaping if model hallucinates it (e.g. tool\_calls)
      jsonStr = jsonStr.replace(/\\_/g, '_');
      
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
         jsonStr = jsonMatch[1];
      } else {
         const start = jsonStr.indexOf('{');
         const end = jsonStr.lastIndexOf('}');
         if (start !== -1 && end !== -1 && end > start) {
            jsonStr = jsonStr.substring(start, end + 1);
         }
      }
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
         toolCalls = parsed.tool_calls;
      }
    } catch (e) {
      console.warn("Agent JSON parse failed (treated as text):", e.message);
    }

    // ULTIMATE BULLETPROOF FALLBACK: If JSON parsing completely fails, scan text for known tool names
    if (!toolCalls) {
      const knownTools = TOOLS.map(t => t.name);
      for (const tName of knownTools) {
        if (responseContent.includes(`"${tName}"`) || responseContent.includes(`'${tName}'`) || responseContent.includes(tName)) {
           let extractedArgs = {};
           const argsMatch = responseContent.match(/"arguments"\s*:\s*({[\s\S]*?})/);
           if (argsMatch) {
              try {
                 // Try to salvage arguments
                 let argsStr = argsMatch[1].replace(/\\_/g, '_').replace(/\\"/g, '"').replace(/,\s*}/g, '}');
                 extractedArgs = JSON.parse(argsStr);
              } catch (err) {
                 console.warn("Regex fallback args parse failed, using empty args.");
              }
           } else {
             // Fallback to searching for specific arguments if "arguments" object is missing
             if (tName === 'searchProducts') {
                const queryMatch = responseContent.match(/"query"\s*:\s*"([^"]+)"/);
                if (queryMatch) extractedArgs.query = queryMatch[1];
             }
           }
           toolCalls = [{ name: tName, arguments: extractedArgs }];
           console.log(`🛠️ Tool call FORCE extracted via keyword match: ${tName}`);
           break;
        }
      }
    }

    let toolResultText = null;
    let finalProducts = [];
    let isOutfit = false;
    let actionData = null;
    let isAiGeneratedConcept = false;
    let conceptData = null;

    // 3. Execute Tool Call if Agent decided to use one
    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0]; // Execute the first requested tool
      const functionName = toolCall.name;
      const args = toolCall.arguments || {};

      try {
        console.log(`🤖 Agent executing tool: ${functionName} with args:`, args);

        if (functionName === 'searchProducts') {
          let matches = await searchProducts({ ...args, useRecentContext: true });
          if (matches.length === 0) {
             const fallback = await fallbackSearchProducts(args);
             matches = fallback.products;
             toolResultText = fallback.explanation + ` Found ${matches.length} alternative items.`;
          } else {
             toolResultText = `Found ${matches.length} matching items in the catalogue.`;
          }
          finalProducts = matches;

        } else if (functionName === 'getProductDetails') {
          const detailsResult = await getProductDetails(args.productRef, recentProducts);
          if (detailsResult.success) {
            finalProducts = [detailsResult.product];
            toolResultText = `Product details: Name: ${detailsResult.details.name}, Price: ${detailsResult.details.price}, Material: ${detailsResult.details.material}, Sizes: ${detailsResult.details.sizes.join(',')}.`;
          } else {
            toolResultText = detailsResult.message;
          }

        } else if (functionName === 'getFashionStylingOutfit') {
          const outfitRes = await getFashionStylingOutfit(args.category || 'Men', args.occasion || 'Casual', args.fitPreference || '', '', args.maxBudget || 5000);
          if (outfitRes.success) {
            finalProducts = outfitRes.items;
            isOutfit = true;
            toolResultText = `Successfully curated a complete outfit. Total Price: ₹${outfitRes.totalPrice}. Advice: ${outfitRes.stylingAdvice}`;
          } else {
            toolResultText = outfitRes.message;
          }

        } else if (functionName === 'addToCart') {
          const cartRes = await addToCartTool(userId, args.productRef, args.size, 1, recentProducts);
          actionData = cartRes;
          finalProducts = recentProducts.length > 0 ? recentProducts.slice(0, 1) : [];
          toolResultText = cartRes.message;

        } else if (functionName === 'addMultipleToCart') {
          const cartRes = await addMultipleToCartTool(userId, [], recentProducts);
          actionData = cartRes;
          if (cartRes.success) {
            finalProducts = (cartRes.addedProducts && cartRes.addedProducts.length > 0) ? cartRes.addedProducts : recentProducts;
          }
          toolResultText = cartRes.message;

        } else if (functionName === 'getCart') {
          const cartRes = await getCartTool(userId);
          finalProducts = (cartRes.items || []).map(i => i.product);
          toolResultText = cartRes.message;

        } else if (functionName === 'getOrderStatus') {
          const orderRes = await getOrderStatusTool(userId);
          toolResultText = orderRes.message;

        } else if (functionName === 'generateImageConcept') {
          isAiGeneratedConcept = true;
          const cleanPrompt = args.prompt.replace(/[^\w\s-]/gi, '').trim();
          const seed = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
          const encodedPrompt = encodeURIComponent(`fashion photoshoot full product view ${cleanPrompt} studio lighting hyperrealistic 8k`);
          const generatedImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&seed=${seed}&nologo=true`;
          
          conceptData = {
            title: `AI Visual Concept: ${cleanPrompt}`,
            imageUrl: generatedImageUrl,
            fashionStyle: "Generated AI Concept",
            note: "AI Generated Concept • Not Store Inventory"
          };
          toolResultText = `Tell the user you have generated an AI visual concept design for '${cleanPrompt}'. Note that this is not real store inventory.`;
        } else {
          toolResultText = "Tool not recognized or implemented.";
        }

      } catch (err) {
        console.error("Error executing agent tool:", err);
        toolResultText = `Error executing tool: ${err.message}`;
      }

      // 4. Bypassing the second LLM call to save 10-15 seconds of processing time!
      // Instead, we programmatically generate a friendly response.
      let finalChatText = "";
      if (functionName === 'searchProducts') {
        if (finalProducts.length > 0) {
           finalChatText = `I found some fantastic options for "${args.query || args.category || 'you'}"! Check out these items below. Let me know if you want to refine the search.`;
        } else {
           finalChatText = `I couldn't find exactly what you're looking for this time. Would you like to try searching for something else?`;
        }
      } else if (functionName === 'getFashionStylingOutfit') {
        finalChatText = toolResultText + ` How do you like this style?`;
      } else if (functionName === 'addToCart' || functionName === 'addMultipleToCart') {
        finalChatText = toolResultText + ` 🛒 Ready to checkout, or do you want to keep shopping?`;
      } else if (functionName === 'getProductDetails') {
        finalChatText = `Here are the details you requested! ` + toolResultText;
      } else if (functionName === 'getCart' || functionName === 'getOrderStatus') {
        finalChatText = toolResultText;
      } else {
        finalChatText = `I've processed your request. Here are the results!`;
      }

      return res.json({
        success: true,
        reply: finalChatText,
        recommendedProducts: finalProducts.slice(0, 6),
        isOutfit,
        isAiGeneratedConcept,
        conceptData,
        actionData,
        action: (functionName === 'addToCart' || functionName === 'addMultipleToCart') ? 'ADD_TO_CART_SUCCESS' : null
      });

    } else {
      // 5. No Tool Called - Agent decided to answer normally
      return res.json({
        success: true,
        reply: responseContent,
        recommendedProducts: [],
      });
    }

  } catch (error) {
    console.error('aiChat Agent Loop Error:', error);
    res.json({
      success: false,
      message: 'I\'m unable to check the store catalogue right now. Please try again in a moment.'
    });
  }
};

/**
 * Vector-Based Visual Search Controller
 */
export const visualSearch = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image data is required' });
    }

    let base64Data = image;
    // ensure prefix is present or absent based on what python expects.
    // our python script strips prefix if it exists.

    const embeddingServiceUrl = process.env.EMBEDDING_SERVICE_URL || 'http://127.0.0.1:8000';

    try {
      // Call Python Vector Search Service
      const searchRes = await axios.post(`${embeddingServiceUrl}/search`, {
        image_base64: base64Data,
        limit: 8
      }, { timeout: 15000 });

      if (searchRes.data && searchRes.data.success) {
        const results = searchRes.data.results;
        
        if (results.length === 0) {
          return res.json({
            success: true,
            isFashionItem: true,
            description: "No similar items found in the catalogue.",
            detectedSpecs: { category: null, subCategory: null, itemType: null, color: null },
            totalMatches: 0,
            products: []
          });
        }

        // The python service returns an array of {product_id, score}
        // Set a much stricter threshold based on CLIP score distributions.
        // Unrelated (black/noise) = ~0.45 - 0.58
        // Weak match / Different product type = ~0.60 - 0.68
        // Visually similar / Strong match = 0.70+
        const threshold = parseFloat(process.env.VISUAL_SEARCH_THRESHOLD) || 0.70;
        const validResults = results.filter(r => r.score >= threshold);
        
        if (validResults.length === 0) {
          return res.json({
            success: true,
            isFashionItem: true,
            description: "No visually similar products found.",
            detectedSpecs: { category: null, subCategory: null, itemType: null, color: null },
            totalMatches: 0,
            products: []
          });
        }

        // Extract product IDs
        const productIds = validResults.map(r => r.product_id);
        
        // Fetch products from MongoDB
        // Keep order of Qdrant results
        const products = await productModel.find({ _id: { $in: productIds } }).lean();
        
        // Sort matching products based on the scores from validResults
        const sortedProducts = productIds.map(id => {
          const product = products.find(p => p._id.toString() === id);
          if (product) {
            const match = validResults.find(r => r.product_id === id);
            product.similarityScore = match ? match.score : 0;
            return product;
          }
          return null;
        }).filter(Boolean);

        return res.json({
          success: true,
          isFashionItem: true,
          description: `Found ${sortedProducts.length} visually similar items.`,
          detectedSpecs: { category: null, subCategory: null, itemType: null, color: null }, // Kept for frontend compatibility
          totalMatches: sortedProducts.length,
          products: sortedProducts
        });
      }
    } catch (err) {
      console.error('Visual Search Error:', err.message);
      
      // Handle explicit 400 Bad Request from Python API (e.g. blank images)
      if (err.response && err.response.status === 400) {
          return res.json({
              success: true,
              isFashionItem: false,
              description: err.response.data?.detail || "Uploaded image is not suitable for visual search.",
              detectedSpecs: { category: null, subCategory: null, itemType: null, color: null },
              totalMatches: 0,
              products: []
          });
      }
      
      return res.json({
        success: false,
        message: "Visual search service is temporarily unavailable or returned an error."
      });
    }

  } catch (error) {
    console.error('Visual Search Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Visual Search Error'
    });
  }
};

// In-memory cache for NLU Search to optimize repetitive queries
const nluCache = new Map();

/**
 * Natural Language Search Endpoint
 * Extracts intent from query using Ollama and queries DB.
 */
export const nluSearch = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const cleanQuery = query.trim();
    
    // Check cache
    if (nluCache.has(cleanQuery)) {
      console.log(`🧠 NLU Cache hit for: "${cleanQuery}"`);
      return res.json({ success: true, products: nluCache.get(cleanQuery), cached: true });
    }

    const modelToUse = process.env.OLLAMA_MODEL || OLLAMA_MODEL;
    
    let extractedFilters = null;
    
    try {
      // Fast prompt to extract JSON intent
      const systemPrompt = `You are a shopping search intent extractor. 
Extract filters from the user's shopping query. 
Return ONLY a valid JSON object. Do not include markdown code blocks, just raw JSON.
Possible keys: 
- category: (Men, Women, Kids)
- subCategory: (e.g. shirt, tshirt, jeans, shoes)
- color: (e.g. black, blue)
- fit: (e.g. oversized, slim, regular)
- maxPrice: (number)
- occasion: (e.g. casual, party, college, formal)
- brand: (string)

If a key is not applicable, omit it.
Example query: "blue casual outfit under 2000 for college"
Example output: {"color": "blue", "occasion": "casual", "maxPrice": 2000}`;

      console.log(`🤖 Requesting NLU extraction for: "${cleanQuery}"`);
      const response = await callOllama('/api/chat', {
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanQuery }
        ],
        stream: false
      }, 15000); // Increased timeout to 15s to allow local LLM to process
      
      const responseContent = response.data.message.content;
      
      // Parse JSON
      let jsonStr = responseContent;
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      extractedFilters = JSON.parse(jsonStr);
      console.log(`✅ Extracted NLU Filters:`, extractedFilters);

    } catch (error) {
      console.warn(`⚠️ NLU Extraction failed/timed out. Falling back to simple search. Error: ${error.message}`);
      // Fallback: silently fail and let the system do normal text scoring search
      
      // Smart Regex Fallback for common constraints if LLM fails
      extractedFilters = {};
      const priceMatch = cleanQuery.match(/(?:under|below|less than|max)\s*(?:rs|rupees|₹|\$)?\s*(\d+)/i);
      if (priceMatch) {
        extractedFilters.maxPrice = Number(priceMatch[1]);
        console.log(`✅ Regex Fallback extracted maxPrice: ${extractedFilters.maxPrice}`);
      }
      
      const genderMatch = cleanQuery.match(/\b(men|women|boys|girls|kids)\b/i);
      if (genderMatch) {
        let g = genderMatch[1].toLowerCase();
        if (g === 'boys' || g === 'girls') g = 'kids';
        extractedFilters.category = g.charAt(0).toUpperCase() + g.slice(1);
      }
    }

    // Call the existing local DB search service
    let products = [];
    if (extractedFilters && Object.keys(extractedFilters).length > 0) {
      // Use NLU filters + query token scoring for extra accuracy
      products = await searchProducts({ ...extractedFilters, query: cleanQuery, limit: 10 });
    } else {
      // Fallback: normal query search
      products = await searchProducts({ query: cleanQuery, limit: 10 });
    }
    
    // Cache the result
    if (products.length > 0) {
      nluCache.set(cleanQuery, products);
      // Keep cache size manageable
      if (nluCache.size > 100) {
        const firstKey = nluCache.keys().next().value;
        nluCache.delete(firstKey);
      }
    }

    return res.json({
      success: true,
      products: products
    });

  } catch (error) {
    console.error('NLU Search Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'NLU Search Error'
    });
  }
};
