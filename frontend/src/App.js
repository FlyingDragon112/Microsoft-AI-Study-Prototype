import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Timer from './Timer';
import TodoList from "./TodoList";

function ChatBox({ messages, onSend }) {
  const handleTextToSpeech = async (text) => {
    try {
      await fetch('http://localhost:8000/text-to-speech/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
    } catch (err) {
      alert("Text-to-speech failed.");
    }
  };

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
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

  const handleSpeechToText = async () => {
    setListening(true);
    try {
      const res = await fetch('http://localhost:8000/speech-to-text/', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.text) {
        setInput(data.text);
      }
    } catch (err) {
      alert("Speech recognition failed.");
    } finally {
      setListening(false);
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
            {msg.role === 'bot' && (
              <div className="crackit-bot-actions">
                <button
                  className="crackit-bot-action-btn"
                  title="Text to Speech"
                  onClick={() => handleTextToSpeech(msg.text)}
                >
                  🔊
                </button>
                <button className="crackit-bot-action-btn" title="Bookmark">
                  🔖
                </button>
              </div>
            )}
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
          placeholder="Start studying...."
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        <button
          className="crackit-chat-attach-btn"
          title="Attach file"
        >
          📎
        </button>
        <button className="crackit-chat-send-btn" onClick={handleSend}>→</button>
      </div>
      {listening && (
        <div className="crackit-listening-msg">Microphone is open, speak now...</div>
      )}
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles(prev => [...prev, { name: file.name, checked: true }]);
    }
  };

  const toggleFileCheck = (idx) => {
    setUploadedFiles(prev =>
      prev.map((f, i) => i === idx ? { ...f, checked: !f.checked } : f)
    );
  };

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
      {/* Header */}
      <div className="crackit-header">
        <div className="crackit-header-left">
          <div className="crackit-logo">📚</div>
          <span className="crackit-header-title">CrackIT</span>
        </div>
        <nav className="crackit-header-nav">
          <button className="crackit-header-nav-link">Notes</button>
          <button className="crackit-header-nav-link">Meditate</button>
          <button className="crackit-header-nav-link">Analytics</button>
          <div className="crackit-header-profile">👤</div>
        </nav>
      </div>

      <div className="crackit-main">
        {/* Left Sidebar */}
        <div className="crackit-sidebar">
          <div className="crackit-sidebar-header">
            <span>Your Learning Material</span>
            <button className="crackit-panel-collapse-btn">Add Icon</button>
          </div>
          <div className="crackit-sidebar-upload">
            <input
              type="file"
              id="source-upload"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <label htmlFor="source-upload" className="crackit-upload-btn">
              + Add Source
            </label>
          </div>
          <div className="crackit-sidebar-files">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="crackit-sidebar-file">
                <span className="crackit-sidebar-file-icon">📄</span>
                <span className="crackit-sidebar-file-name">{file.name}</span>
                <input
                  type="checkbox"
                  className="crackit-sidebar-file-check"
                  checked={file.checked}
                  onChange={() => toggleFileCheck(idx)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Center Content */}
        <div className="crackit-content">
          <div className="crackit-content-header">
            <span className="crackit-content-header-dropdown">
              Explanation Mode <span className="arrow">▾</span>
            </span>
          </div>
          <ChatBox messages={messages} onSend={handleChat} />
        </div>

        {/* Right Tools Panel */}
        <div className="crackit-tools">
          <div className="crackit-tools-header">
            <span>Tools</span>
          </div>
          <div className="crackit-tools-body">
            <div style={{ height: 10 }} />
            <Timer />
            <div style={{ height: 15 }} />
            <TodoList />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
