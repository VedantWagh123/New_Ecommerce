const axios = require('axios');
const TOOLS = [
  {
    name: "getFashionStylingOutfit",
    description: "Curate a complete 4-piece head-to-toe outfit recommendation for a specific occasion and budget.",
    parameters: {
      category: "string (e.g., Men, Women, Kids)",
      occasion: "string",
      maxBudget: "number"
    }
  }
];
const prompt = You are an AI Fashion Agent.
AVAILABLE TOOLS:
 + JSON.stringify(TOOLS, null, 2) + 
INSTRUCTIONS:
To call a tool, output a JSON object in this exact format (and NO other text):
{
  "tool_calls": [
    {
      "name": "getFashionStylingOutfit",
      "arguments": { "category": "Men" }
    }
  ]
}
;
axios.post('http://127.0.0.1:11434/api/chat', {
  model: 'veloura-stylist:latest',
  messages: [{ role: 'system', content: prompt }, { role: 'user', content: 'college outfit under 3000' }],
  stream: false
}).then(res => console.log(res.data.message.content))
  .catch(err => console.error(err.message));
