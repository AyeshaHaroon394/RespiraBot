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

      const eventSource = new EventSource(
        `http://localhost:5000/api/chat?message=${encodeURIComponent(input)}`
      );

      eventSource.onopen = () => {
        console.log('Stream opened');
      };

      eventSource.onmessage = (event) => {
        console.log('Received message:', event.data);
        if (event.data && event.data !== 'Stream finished') {
          const botMessage: Message = { sender: 'bot', content: event.data };
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        }
        setLoading(false);
      };

      eventSource.onerror = (error) => {
        console.error('Stream error:', error);
        setLoading(false);
        eventSource.close();

        const errorMessage: Message = {
          sender: 'bot',
          content: 'An error occurred while fetching a response.',
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      };

      return () => {
        eventSource.close();
      };
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
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
