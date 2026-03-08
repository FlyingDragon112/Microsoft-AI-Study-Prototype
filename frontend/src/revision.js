import React, { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import "./revision.css";

const fallbackFlashcards = [
  { question: "What is the Nernst Equation?", answer: "E = E° - (RT/nF) ln Q, where E is the cell potential, E° is the standard cell potential, R is the gas constant, T is temperature, n is the number of electrons transferred, F is Faraday's constant, and Q is the reaction quotient.", topic: "Electrochemistry" },
  { question: "What is Faraday's First Law of Electrolysis?", answer: "The mass of a substance deposited at an electrode during electrolysis is directly proportional to the quantity of electricity passed through the electrolyte.", topic: "Electrochemistry" },
  { question: "Define standard electrode potential.", answer: "The potential difference developed between the metal electrode and the standard hydrogen electrode when the concentration of the metal ion solution is 1 M, temperature is 298 K, and pressure is 1 atm.", topic: "Electrochemistry" },
  { question: "What is an electrochemical cell?", answer: "A device that converts chemical energy into electrical energy through spontaneous redox reactions. It consists of two half-cells connected by a salt bridge.", topic: "Electrochemistry" },
  { question: "What is the role of a salt bridge?", answer: "A salt bridge maintains electrical neutrality in the two half-cells by allowing the flow of ions, thereby completing the electrical circuit.", topic: "Electrochemistry" },
];

function Revision() {
  const [flashcards, setFlashcards] = useState(fallbackFlashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [markedForRevision, setMarkedForRevision] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/get-flashcards-data", { method: "POST" });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFlashcards(data);
        }
      } catch (err) {
        setError("Could not load flashcards from server. Showing sample cards.");
      } finally {
        setLoading(false);
      }
    };
    fetchFlashcards();
  }, []);

  const total = flashcards.length;
  const card = flashcards[currentIndex];
  const progressPercent = ((currentIndex + 1) / total) * 100;

  const goNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const toggleMark = () => {
    setMarkedForRevision((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="revision-container">
        <div className="revision-loading">Loading flashcards...</div>
      </div>
    );
  }

  return (
    <div className="revision-container">
      {error && <div className="revision-error">{error}</div>}
      {/* Progress bar area */}
      <div className="revision-progress-bar-area">
        <div className="revision-progress-info">
          <span className="revision-progress-text">Progress: {currentIndex + 1}/{total}</span>
          <span className="revision-topic-text">Topic: {card.topic}</span>
        </div>
        <div className="revision-progress-track">
          <div className="revision-progress-fill" style={{ width: `${progressPercent}%` }} />
          <div className="revision-progress-thumb" style={{ left: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Flashcard */}
      <div className="revision-flashcard-wrapper">
        <div className="revision-flashcard-badge">Flashcard {currentIndex + 1}/{total}</div>
        <div className={`revision-flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)}>
          <div className="revision-flashcard-inner">
            <div className="revision-flashcard-front">
              <div className="revision-flashcard-label">Question</div>
              <div className="revision-flashcard-question">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{card.question}</ReactMarkdown>
              </div>
              <div className="revision-flashcard-hint">(Try to recall before flipping)</div>
              <div className="revision-flashcard-divider" />
              <button className="revision-flip-btn" onClick={e => { e.stopPropagation(); setFlipped(true); }}>Flip Card</button>
            </div>
            <div className="revision-flashcard-back">
              <div className="revision-flashcard-label">Answer</div>
              <div className="revision-flashcard-answer">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{card.answer}</ReactMarkdown>
              </div>
              <div className="revision-flashcard-divider" />
              <button className="revision-flip-btn" onClick={e => { e.stopPropagation(); setFlipped(false); }}>Flip Back</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="revision-controls">
        <button className="revision-ctrl-btn" onClick={goPrev} disabled={currentIndex === 0}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#1D1B20"/>
          </svg>
          Prev
        </button>
        <button
          className={`revision-ctrl-btn revision-mark-btn ${markedForRevision.has(currentIndex) ? "marked" : ""}`}
          onClick={toggleMark}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3ZM17 18L12 15.82L7 18V5H17V18Z" fill={markedForRevision.has(currentIndex) ? "#6750A4" : "black"}/>
          </svg>
          {markedForRevision.has(currentIndex) ? "Marked" : "Mark for revision"}
        </button>
        <button className="revision-ctrl-btn" onClick={goNext} disabled={currentIndex === total - 1}>
          Next
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 13H16.17L10.58 18.59L12 20L20 12L12 4L10.59 5.41L16.17 11H4V13Z" fill="#1D1B20"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Revision;
