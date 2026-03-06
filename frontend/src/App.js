import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Timer from './Timer';
import TodoList from "./TodoList";

function ChatBox({ messages, onSend }) {
  const [ttsLanguage, setTtsLanguage] = useState("en-US");
  const ttsLanguages = [
    { code: "en-US", label: "English" },
    { code: "hi-IN", label: "Hindi" },
    { code: "bn-IN", label: "Bengali" },
    { code: "gu-IN", label: "Gujarati" }
  ];

  const handleTextToSpeech = async (text) => {
    try {
      await fetch('http://localhost:8000/text-to-speech/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: ttsLanguage })
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
              <div className="crackit-bot-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    className="crackit-bot-action-btn crackit-bot-action-circle"
                    title="Text to Speech"
                    onClick={() => handleTextToSpeech(msg.text)}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="12" fill="#d3e6ef" />
                      <path d="M8 9V15H11L15 19V5L11 9H8Z" fill="#222" />
                    </svg>
                  </button>
                  <select
                    value={ttsLanguage}
                    onChange={e => setTtsLanguage(e.target.value)}
                    className="crackit-tts-language-dropdown"
                    style={{ fontSize: '0.9em', padding: '2px 6px', borderRadius: '8px', border: '1px solid #b7d3e2', marginLeft: '2px', background: '#f4fafd' }}
                    title="Select TTS Language"
                  >
                    {ttsLanguages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="crackit-bot-action-btn crackit-bot-action-circle"
                  title="Bookmark"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="12" fill="#d3e6ef" />
                    <path d="M7 5H17V19L12 16L7 19V5Z" fill="#222" />
                  </svg>
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
          className={`crackit-chat-speech-btn ${listening ? 'active' : ''}`}
          title="Voice input"
          onClick={handleSpeechToText}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 10V12C19 16.4183 15.4183 20 11 20C6.58172 20 3 16.4183 3 12V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 20V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 23H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className="crackit-chat-attach-btn"
          title="Attach file"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59718 21.9983 8.005 21.9983C6.41282 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.33 3.18C13.0806 2.42945 14.0991 2.00758 15.165 2.00758C16.2309 2.00758 17.2494 2.42945 18 3.18C18.7506 3.93055 19.1724 4.94905 19.1724 6.015C19.1724 7.08095 18.7506 8.09945 18 9.85L9.41 18.44C8.935 18.915 8.2905 19.1817 7.615 19.1817C6.9395 19.1817 6.295 18.915 5.82 18.44C5.34499 17.965 5.07833 17.3205 5.07833 16.645C5.07833 15.9695 5.34499 15.325 5.82 14.85L13.07 7.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="crackit-chat-send-btn" onClick={handleSend}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toolsCollapsed, setToolsCollapsed] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:8000/upload/", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setUploadedFiles((prev) => [...prev, { name: data.filename, checked: false }]);
        } else {
          console.error("File upload failed.");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
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

  const updateTickedFiles = useCallback(async () => {
    const tickedFiles = uploadedFiles.filter(file => file.checked).map(file => file.name);

    try {
      const response = await fetch("http://localhost:8000/ticked-files/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticked_files: tickedFiles }),
      });

      if (!response.ok) {
        console.error("Failed to update ticked files.");
      }
    } catch (error) {
      console.error("Error updating ticked files:", error);
    }
  }, [uploadedFiles]);

  useEffect(() => {
    updateTickedFiles();
  }, [updateTickedFiles]);

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
        <div className={`crackit-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="crackit-sidebar-header">
            <span className="crackit-sidebar-icon">📚</span>
            <span className="crackit-sidebar-title">Your Learning Material</span>
            <button 
              className="crackit-panel-collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
                      <svg
                width="40"
                height="32"
                viewBox="0 0 40 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0)">
                  <rect
                    x="40"
                    width="32"
                    height="40"
                    rx="16"
                    transform="rotate(90 40 0)"
                    fill="#AFCFDD"
                  />
                  <g clipPath="url(#clip1)">
                    <path
                      d="M17.1667 16L22.1667 11L23.3334 12.1667L19.5 16L23.3334 19.8333L22.1667 21L17.1667 16Z"
                      fill="#49454F"
                    />
                  </g>
                </g>

                <defs>
                  <clipPath id="clip0">
                    <rect
                      x="40"
                      width="32"
                      height="40"
                      rx="16"
                      transform="rotate(90 40 0)"
                      fill="white"
                    />
                  </clipPath>
                  <clipPath id="clip1">
                    <rect
                      x="36"
                      width="32"
                      height="32"
                      rx="16"
                      transform="rotate(90 36 0)"
                      fill="white"
                    />
                  </clipPath>
                </defs>
              </svg>
            </button>
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
              Explanation Mode <span className="arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 10L12 16L6 10L7.4 8.6L12 13.2L16.6 8.6L18 10Z" fill="#1D1B20"/>
                </svg>
              </span>
            </span>
          </div>
          <ChatBox messages={messages} onSend={handleChat} />
        </div>

        {/* Right Tools Panel */}
        <div className={`crackit-tools ${toolsCollapsed ? 'collapsed' : ''}`}>
          <div className="crackit-tools-header">
            <span className="crackit-tools-icon">🛠️</span>
            <span className="crackit-tools-title">Tools</span>
            <button 
              className="crackit-panel-collapse-btn"
              onClick={() => setToolsCollapsed(!toolsCollapsed)}
            >
                      <svg
                width="40"
                height="32"
                viewBox="0 0 40 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0)">
                  <rect
                    x="40"
                    width="32"
                    height="40"
                    rx="16"
                    transform="rotate(90 40 0)"
                    fill="#AFCFDD"
                  />
                  <g clipPath="url(#clip1)">
                    <path
                      d="M17.1667 16L22.1667 11L23.3334 12.1667L19.5 16L23.3334 19.8333L22.1667 21L17.1667 16Z"
                      fill="#49454F"
                    />
                  </g>
                </g>

                <defs>
                  <clipPath id="clip0">
                    <rect
                      x="40"
                      width="32"
                      height="40"
                      rx="16"
                      transform="rotate(90 40 0)"
                      fill="white"
                    />
                  </clipPath>
                  <clipPath id="clip1">
                    <rect
                      x="36"
                      width="32"
                      height="32"
                      rx="16"
                      transform="rotate(90 36 0)"
                      fill="white"
                    />
                  </clipPath>
                </defs>
              </svg>
            </button>
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