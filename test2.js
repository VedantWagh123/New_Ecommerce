const axios = require('axios');
axios.post('http://localhost:4000/api/ai/chat', { prompt: 'show me black t-shirts', conversationHistory: [] })
  .then(res => console.log(JSON.stringify(res.data, null, 2)))
  .catch(err => console.error(err.message));
