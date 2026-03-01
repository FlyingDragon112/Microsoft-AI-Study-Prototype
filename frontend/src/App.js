import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

function ChatBox({ messages, onSend }) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <div className="crackit-chatbox">
      <div className="crackit-chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`crackit-chat-bubble ${msg.role}`}>
            <div className="crackit-chat-bubble-content">
              <ReactMarkdown
                children={msg.text}
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              />
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="crackit-chat-input-row">
        <input
          type="text"
          className="crackit-chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        <button className="crackit-chat-send-btn" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState([]);

  const handleChat = async (query) => {
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    const res = await fetch('http://localhost:8000/chat/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: String(query) }),
    });
    const data = await res.json();
    let responseText;
    if (data.response && typeof data.response === 'object') {
      responseText = data.response.content || '[Object]';
    } else {
      responseText = data.response;
    }

    responseText = responseText.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math.trim()}$$`);
    responseText = responseText.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);
    responseText = responseText.replace(/(?<!\w)\[([^[\]]*\\[a-zA-Z][^[\]]*)\](?!\w)/g, (_, math) => `$$${math.trim()}$$`);
    responseText = responseText.replace(/\$\s+(.*?)\s+\$/g, (_, math) => `$${math}$`);

    setMessages(prev => [...prev, { role: 'bot', text: responseText }]);
  };

  return (
    <div className="crackit-app">
      <div className="crackit-header">
        <div className="crackit-logo" />
        CrackIT
      </div>
      <div className="crackit-main">
        <div className="crackit-sidebar">
          <div className="crackit-sidebar-header">Source Library</div>
          {/* Add source library content here */}
        </div>
        <div className="crackit-content">
          <div className="crackit-content-header">
            Explanation Mode
            {/* Add dropdown or controls here if needed */}
          </div>
          <ChatBox messages={messages} onSend={handleChat} />
        </div>
      </div>
    </div>
  );
}

export default App;
