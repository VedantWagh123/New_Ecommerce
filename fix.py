import json

file_path = r'backend/controllers/aiController.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace TOOLS array
old_tools_str = '''// JSON Schema Tool Definitions for Ollama Native Tool Calling
const TOOLS = [
  {
    type: "function",
    function: {
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
  },
  {
    type: "function",
    function: {
      name: "getProductDetails",
      description: "Get detailed specifications, materials, and rating for a specific product.",
      parameters: {
        type: "object",
        properties: {
          productRef: { type: "string", description: "The product ID or name to get details for" }
        },
        required: ["productRef"]
      }
    }
  },
  {
    type: "function",
    function: {
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
    }
  },
  {
    type: "function",
    function: {
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
    }
  },
  {
    type: "function",
    function: {
      name: "addMultipleToCart",
      description: "Add a complete outfit (multiple items) to the user's shopping cart.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getCart",
      description: "View the user's current shopping cart contents and total price.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getOrderStatus",
      description: "Track the user's order status and delivery updates.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
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
  }
];'''

new_tools_str = '''// JSON Schema Tool Definitions (Prompt-based)
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
];'''

if old_tools_str in content:
    content = content.replace(old_tools_str, new_tools_str)
    print("Replaced TOOLS.")
else:
    print("Could not find old_tools_str.")

old_history_str = '''    // Append Conversation History for Context (so agent remembers "under 1500" or "black ones")
    for (const msg of conversationHistory) {
      if (msg.sender === 'user') {
        messages.push({ role: 'user', content: msg.text });
      } else if (msg.sender === 'ai' && msg.text) {
        messages.push({ role: 'assistant', content: msg.text });
      }
    }

    // Append current user prompt
    messages.push({ role: 'user', content: prompt.trim() });'''

new_history_str = '''    // Ensure we don't duplicate the latest prompt if the frontend already appended it
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
    }'''

if old_history_str in content:
    content = content.replace(old_history_str, new_history_str)
    print("Replaced history loop.")
else:
    print("Could not find old_history_str.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
