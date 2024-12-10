const express = require('express');
const { OpenAI } = require('openai');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Custom prompt to guide the model for symptom checking
const SYMPTOM_CHECKER_CONTEXT = "You are a medical chatbot. Your role is exclusively to check symptoms and provide preliminary advice. You must not respond to irrelevant, non-medical, or casual questions. If asked anything unrelated to medical topics, politely decline and redirect to medical inquiries only.";

app.post('/api/chat', async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYMPTOM_CHECKER_CONTEXT },
        { role: 'user', content: userMessage },
      ],
      stream: true,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = ''; // To collect the full response

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        res.write(`data: ${content}\n\n`);
        fullResponse += content; // Append each chunk to the full response
      }
    }

    console.log('Full response from OpenAI (stream):', fullResponse);

    res.write('event: end\n');
    res.write('data: Stream finished\n\n');
    res.end();

  } catch (error) {
    console.error('Error fetching from OpenAI:', error);

    if (error.response && error.response.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else {
      res.status(500).json({ error: 'Error communicating with OpenAI' });
    }
  }
});

app.post('/api/chat-text', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    // Prepend the system context to the conversation history
    const enrichedMessages = [
      { role: 'system', content: SYMPTOM_CHECKER_CONTEXT },
      ...messages,
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: enrichedMessages,
    });

    const botMessage = completion.choices[0].message.content.trim();
    console.log('Response from OpenAI (text):', botMessage);

    res.json({ response: botMessage });
  } catch (error) {
    console.error('Error fetching from OpenAI:', error);

    if (error.response && error.response.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else {
      res.status(500).json({ error: 'Error communicating with OpenAI' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
