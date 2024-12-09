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

      // Create an EventSource to handle streaming response
      const eventSource = new EventSource(`http://localhost:5000/api/chat?message=${encodeURIComponent(input)}`);

      eventSource.onopen = () => {
        console.log('Stream opened');
      };

      eventSource.onmessage = (event) => {
        console.log('Received message:', event.data);
        if (event.data && event.data !== 'Stream finished') {
          const botMessage: Message = { sender: 'bot', content: event.data };
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Stream error:', error);
        setLoading(false);
        eventSource.close(); // Close the connection when an error occurs

        const errorMessage: Message = { sender: 'bot', content: 'An error occurred while fetching a response.' };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      };

      // Close the connection manually when the component is unmounted or you want to stop the connection
      return () => {
        eventSource.close();
      };
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Chatbot</h1>
        <div className="chat-window">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
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
      </header>
    </div>
  );
}

export default App;
