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
const SYMPTOM_CHECKER_CONTEXT = "You are a medical chatbot trained to check symptoms and provide preliminary advice. Please help users by asking clarifying questions if needed and suggesting possible conditions based on the provided symptoms. Keep responses clear and informative, and advise users to consult a doctor for accurate diagnosis. If you are asked to respond to non medical queries then ask for a relevant question. You are a symptom checking chatbot only.";

app.post('/api/chat', async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Set up streaming for real-time responses
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYMPTOM_CHECKER_CONTEXT },
        { role: 'user', content: userMessage }
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

    // Handle specific error for rate limit exceeded
    if (error.response && error.response.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else {
      res.status(500).json({ error: 'Error communicating with OpenAI' });
    }
  }
});

app.post('/api/chat-text', async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Create a chat completion request
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYMPTOM_CHECKER_CONTEXT },
        { role: 'user', content: userMessage }
      ],
    });

    const botMessage = completion.choices[0].message.content.trim();
    console.log('Response from OpenAI (text):', botMessage); // Log the response

    res.json({ response: botMessage });
  } catch (error) {
    console.error('Error fetching from OpenAI:', error);

    // Handle specific error for rate limit exceeded
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
