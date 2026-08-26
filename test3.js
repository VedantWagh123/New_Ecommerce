const axios = require('axios');
const TOOLS = [
  {
    type: "function",
    function: {
      name: "getFashionStylingOutfit",
      description: "Curate a complete 4-piece head-to-toe outfit recommendation for a specific occasion and budget.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          occasion: { type: "string" },
          maxBudget: { type: "number" }
        }
      }
    }
  }
];
axios.post('http://127.0.0.1:11434/api/chat', {
  model: 'veloura-stylist:latest',
  messages: [{ role: 'user', content: 'college outfit under 3000' }],
  tools: TOOLS,
  stream: false
}).then(res => console.log(JSON.stringify(res.data.message.tool_calls, null, 2)))
  .catch(err => console.error(err.message));
