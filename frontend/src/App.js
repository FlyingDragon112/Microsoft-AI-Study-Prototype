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
    console.log(`Selected language for TTS: ${ttsLanguage}`); // Debugging log

    if (!text.trim()) {
      alert("Please enter text for text-to-speech.");
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/text-to-speech/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: ttsLanguage })
      });

      if (!response.ok) {
        alert("Text-to-speech failed.");
      }
    } catch (err) {
      console.error("Error during text-to-speech:", err);
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
                    <rect width="24" height="24" rx="12" fill="white"/>
                    <path d="M14 20.7251V18.6751C15.5 18.2418 16.7083 17.4084 17.625 16.1751C18.5417 14.9418 19 13.5418 19 11.9751C19 10.4084 18.5417 9.00843 17.625 7.7751C16.7083 6.54176 15.5 5.70843 14 5.2751V3.2251C16.0667 3.69176 17.75 4.7376 19.05 6.3626C20.35 7.9876 21 9.85843 21 11.9751C21 14.0918 20.35 15.9626 19.05 17.5876C17.75 19.2126 16.0667 20.2584 14 20.7251ZM3 15.0001V9.0001H7L12 4.0001V20.0001L7 15.0001H3ZM14 16.0001V7.9501C14.7833 8.31676 15.3958 8.86676 15.8375 9.6001C16.2792 10.3334 16.5 11.1334 16.5 12.0001C16.5 12.8501 16.2792 13.6376 15.8375 14.3626C15.3958 15.0876 14.7833 15.6334 14 16.0001ZM10 8.8501L7.85 11.0001H5V13.0001H7.85L10 15.1501V8.8501Z" fill="#1D1B20"/>
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 14C11.1667 14 10.4583 13.7083 9.875 13.125C9.29167 12.5417 9 11.8333 9 11V5C9 4.16667 9.29167 3.45833 9.875 2.875C10.4583 2.29167 11.1667 2 12 2C12.8333 2 13.5417 2.29167 14.125 2.875C14.7083 3.45833 15 4.16667 15 5V11C15 11.8333 14.7083 12.5417 14.125 13.125C13.5417 13.7083 12.8333 14 12 14ZM11 21V17.925C9.26667 17.6917 7.83333 16.9167 6.7 15.6C5.56667 14.2833 5 12.75 5 11H7C7 12.3833 7.4875 13.5625 8.4625 14.5375C9.4375 15.5125 10.6167 16 12 16C13.3833 16 14.5625 15.5125 15.5375 14.5375C16.5125 13.5625 17 12.3833 17 11H19C19 12.75 18.4333 14.2833 17.3 15.6C16.1667 16.9167 14.7333 17.6917 13 17.925V21H11Z" fill="#1D1B20"/>
          </svg>

        </button>
        <button
          className="crackit-chat-attach-btn"
          title="Attach file"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 15.75C18 17.4833 17.3917 18.9583 16.175 20.175C14.9583 21.3917 13.4833 22 11.75 22C10.0167 22 8.54167 21.3917 7.325 20.175C6.10833 18.9583 5.5 17.4833 5.5 15.75V6.5C5.5 5.25 5.9375 4.1875 6.8125 3.3125C7.6875 2.4375 8.75 2 10 2C11.25 2 12.3125 2.4375 13.1875 3.3125C14.0625 4.1875 14.5 5.25 14.5 6.5V15.25C14.5 16.0167 14.2333 16.6667 13.7 17.2C13.1667 17.7333 12.5167 18 11.75 18C10.9833 18 10.3333 17.7333 9.8 17.2C9.26667 16.6667 9 16.0167 9 15.25V6H11V15.25C11 15.4667 11.0708 15.6458 11.2125 15.7875C11.3542 15.9292 11.5333 16 11.75 16C11.9667 16 12.1458 15.9292 12.2875 15.7875C12.4292 15.6458 12.5 15.4667 12.5 15.25V6.5C12.4833 5.8 12.2375 5.20833 11.7625 4.725C11.2875 4.24167 10.7 4 10 4C9.3 4 8.70833 4.24167 8.225 4.725C7.74167 5.20833 7.5 5.8 7.5 6.5V15.75C7.48333 16.9333 7.89167 17.9375 8.725 18.7625C9.55833 19.5875 10.5667 20 11.75 20C12.9167 20 13.9083 19.5875 14.725 18.7625C15.5417 17.9375 15.9667 16.9333 16 15.75V6H18V15.75Z" fill="#1D1B20"/>
          </svg>

        </button>
        <button className="crackit-chat-send-btn" onClick={handleSend}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.175 13H4V11H16.175L10.575 5.4L12 4L20 12L12 20L10.575 18.6L16.175 13Z" fill="#1D1B20"/>
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
  const [mode, setMode] = useState("Explanation Mode");

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

  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const toggleFileCheck = (idx) => {
    setUploadedFiles((prev) => {
      const updatedFiles = prev.map((f, i) =>
        i === idx ? { ...f, checked: !f.checked } : f
      );

      // Debounced API call
      debouncedUpdateTickedFiles(updatedFiles);

      return updatedFiles;
    });
  };

  const debouncedUpdateTickedFiles = useRef(
    debounce((updatedFiles) => {
      const tickedFiles = updatedFiles.filter((file) => file.checked).map((file) => file.name);
      fetch("http://localhost:8000/ticked-files/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticked_files: tickedFiles }),
      }).catch((error) => console.error("Error updating ticked files:", error));
    }, 300)
  ).current;

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
          <div className="crackit-logo">
            <svg width="61" height="55" viewBox="0 0 61 55" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_26_89)">
            <path d="M59.834 12.5326C60.7889 13.8932 61.0037 15.4329 60.4786 17.1517L50.6316 49.5931C50.178 51.1209 49.2649 52.404 47.8923 53.4424C46.5197 54.4808 45.0576 55 43.5059 55H10.4558C8.61767 55 6.84521 54.3614 5.13839 53.0843C3.43158 51.8072 2.24397 50.2376 1.57557 48.3757C1.00265 46.7763 0.978779 45.2604 1.50395 43.8281C1.50395 43.7326 1.53976 43.4104 1.61137 42.8613C1.68299 42.3123 1.73073 41.8707 1.7546 41.5365C1.77847 41.3455 1.74267 41.0889 1.64718 40.7666C1.5517 40.4443 1.51589 40.2116 1.53976 40.0684C1.5875 39.8058 1.68299 39.5551 1.82622 39.3164C1.96945 39.0777 2.16639 38.7972 2.41704 38.4749C2.66769 38.1527 2.86463 37.8722 3.00786 37.6335C3.5569 36.7263 4.09401 35.6342 4.61919 34.3571C5.14436 33.08 5.50243 31.9878 5.69341 31.0807C5.76502 30.842 5.77099 30.4839 5.71131 30.0065C5.65163 29.5291 5.64566 29.1949 5.69341 29.0039C5.76502 28.7413 5.96793 28.4071 6.30213 28.0013C6.63633 27.5955 6.83924 27.321 6.91085 27.1777C7.41216 26.3184 7.91346 25.2203 8.41476 23.8835C8.91606 22.5467 9.21446 21.4724 9.30994 20.6608C9.33381 20.446 9.30397 20.064 9.22042 19.515C9.13687 18.9659 9.14284 18.6317 9.23833 18.5124C9.33381 18.202 9.5964 17.838 10.0261 17.4202C10.4558 17.0025 10.7184 16.7339 10.8138 16.6146C11.2674 15.9939 11.7747 14.9854 12.3357 13.5889C12.8966 12.1924 13.2249 11.0406 13.3204 10.1335C13.3442 9.94249 13.3084 9.63813 13.2129 9.22038C13.1175 8.80263 13.0936 8.48633 13.1413 8.27148C13.1891 8.08051 13.2965 7.86567 13.4636 7.62695C13.6307 7.38824 13.8455 7.11372 14.1081 6.80339C14.3707 6.49306 14.5736 6.2424 14.7168 6.05143C14.9078 5.76497 15.1048 5.40093 15.3077 4.95931C15.5106 4.51769 15.6896 4.09994 15.8448 3.70605C15.9999 3.31217 16.1909 2.88249 16.4177 2.41699C16.6445 1.9515 16.8772 1.56955 17.1159 1.27116C17.3546 0.972765 17.6709 0.692274 18.0648 0.429688C18.4587 0.167101 18.8884 0.0298394 19.3539 0.0179036C19.8194 0.00596788 20.3863 0.0716146 21.0547 0.214844L21.0189 0.322266C21.926 0.107422 22.5348 0 22.8451 0H50.0944C51.8609 0 53.2216 0.668403 54.1765 2.00521C55.1313 3.34201 55.3462 4.89366 54.821 6.66016L45.0098 39.1016C44.1504 41.9423 43.297 43.7744 42.4496 44.598C41.6022 45.4216 40.0684 45.8333 37.8484 45.8333H6.73182C6.08729 45.8333 5.63373 46.0124 5.37114 46.3704C5.10855 46.7524 5.09662 47.2656 5.33533 47.9102C5.90825 49.5812 7.627 50.4167 10.4916 50.4167H43.5417C44.234 50.4167 44.9024 50.2317 45.5469 49.8617C46.1915 49.4916 46.6092 48.9963 46.8002 48.3757L57.5424 13.0339C57.7095 12.5087 57.7691 11.8283 57.7214 10.9928C58.6285 11.3509 59.3327 11.8642 59.834 12.5326ZM21.7351 12.6042C21.6396 12.9145 21.6635 13.1831 21.8067 13.4098C21.9499 13.6366 22.1886 13.75 22.5228 13.75H44.2937C44.604 13.75 44.9084 13.6366 45.2068 13.4098C45.5051 13.1831 45.7021 12.9145 45.7976 12.6042L46.5495 10.3125C46.645 10.0022 46.6211 9.73362 46.4779 9.50684C46.3347 9.28006 46.096 9.16667 45.7618 9.16667H23.9909C23.6806 9.16667 23.3762 9.28006 23.0778 9.50684C22.7795 9.73362 22.5825 10.0022 22.487 10.3125L21.7351 12.6042ZM18.7631 21.7708C18.6676 22.0812 18.6915 22.3497 18.8347 22.5765C18.9779 22.8033 19.2166 22.9167 19.5508 22.9167H41.3217C41.632 22.9167 41.9364 22.8033 42.2347 22.5765C42.5331 22.3497 42.7301 22.0812 42.8256 21.7708L43.5775 19.4792C43.673 19.1688 43.6491 18.9003 43.5059 18.6735C43.3627 18.4467 43.124 18.3333 42.7898 18.3333H21.0189C20.7086 18.3333 20.4042 18.4467 20.1058 18.6735C19.8074 18.9003 19.6105 19.1688 19.515 19.4792L18.7631 21.7708Z" fill="black"/>
            </g>
            <defs>
            <clipPath id="clip0_26_89">
            <rect width="60.7292" height="55" fill="white"/>
            </clipPath>
            </defs>
            </svg>

          </div>
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
            <select className="crackit-content-header-dropdown" value={mode} onChange={e => setMode(e.target.value)}>
              <option>Explanation Mode</option>
              <option>Quiz Mode</option>
              <option>Revision Mode</option>
            </select>
          </div>
          <ChatBox messages={messages} onSend={handleChat} />
        </div>

        {/* Right Tools Panel */}
        <div className={`crackit-tools ${toolsCollapsed ? 'collapsed' : ''}`}>
          <div className="crackit-tools-header">
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