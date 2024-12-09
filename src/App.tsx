import React, { useState } from 'react';
import './App.css';

interface Message {
  sender: 'user' | 'bot';
  content: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSendMessage = async () => {
    if (input.trim()) {
      const userMessage: Message = { sender: 'user', content: input };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');
      setLoading(true);

      try {
        // Send the user's message to the API
        const response = await fetch('http://localhost:5000/api/chat-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userMessage: input }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch the bot response.');
        }

        const data = await response.json();
        const botMessage: Message = { sender: 'bot', content: data.response };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } catch (error) {
        console.error('Error fetching bot response:', error);
        const errorMessage: Message = {
          sender: 'bot',
          content: 'An error occurred while fetching the response. Please try again.',
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Chatbot</h1>
        <div className="chat-container">
          <div className="chat-window">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.sender === 'user' ? 'user' : 'bot'}`}
              >
                <p>{message.content}</p>
              </div>
            ))}
            {loading && <div className="loading">Bot is typing...</div>}
          </div>
          <div className="input-section">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
            />
            <button onClick={handleSendMessage} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
