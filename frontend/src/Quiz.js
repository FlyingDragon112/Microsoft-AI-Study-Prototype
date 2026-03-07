import React, { useState, useEffect, useRef } from "react";
import { MathJax } from "better-react-mathjax";
import DOMPurify from "dompurify";
import "./Quiz.css";

// Sanitize HTML (tables, style tags, br, etc.) before passing to MathJax.
// MathJax will find and typeset $...$ and $$...$$ delimiters itself.
const sanitize = (text) =>
  DOMPurify.sanitize(text || "", { ADD_TAGS: ["style"], FORCE_BODY: true });

// Component that renders text containing LaTeX ($/$$/MathJax syntax) and/or HTML
const MathText = ({ text }) => {
  if (!text) return null;
  return (
    <MathJax dynamic>
      <span dangerouslySetInnerHTML={{ __html: sanitize(text) }} />
    </MathJax>
  );
};

const SUBJECT_OPTIONS = ["Chemistry", "Physics", "Maths"];
const NUM_QUESTIONS_OPTIONS = [5, 10, 15, 20];
const TIME_LIMIT_OPTIONS = ["15 mins", "30 mins", "45 mins", "60 mins"];
const OPTION_LABELS = ["A", "B", "C", "D"];

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const QuizStart = ({ onStart }) => {
  const [subjects, setSubjects] = useState(["Chemistry"]);
  const [numQuestions, setNumQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState("30 mins");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleSubject = (s) =>
    setSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = subjects.length === 0
    ? "Select subjects…"
    : subjects.join(", ");

  return (
    <div className="quiz-start-wrapper">
      <img className="quiz-start-image" src={`${process.env.PUBLIC_URL}/image.png`} alt="Quiz" />
      <div className="quiz-start-title">QUIZ TIME!</div>

      <div className="quiz-start-row">
        <span className="quiz-start-label">Subject :</span>
        <div className="quiz-multiselect" ref={dropdownRef}>
          <div
            className={`quiz-multiselect-trigger${dropdownOpen ? " open" : ""}`}
            onClick={() => setDropdownOpen(o => !o)}
          >
            <span className="quiz-multiselect-value">{label}</span>
            <span className="quiz-multiselect-arrow">{dropdownOpen ? "▲" : "▼"}</span>
          </div>
          {dropdownOpen && (
            <div className="quiz-multiselect-menu">
              {SUBJECT_OPTIONS.map(s => (
                <label key={s} className="quiz-multiselect-item">
                  <input
                    type="checkbox"
                    checked={subjects.includes(s)}
                    onChange={() => toggleSubject(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="quiz-start-row">
        <span className="quiz-start-label">No. of Questions:</span>
        <select className="quiz-start-select" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))}>
          {NUM_QUESTIONS_OPTIONS.map(n => <option key={n}>{n}</option>)}
        </select>
      </div>

      <div className="quiz-start-row">
        <span className="quiz-start-label">Time Limit:</span>
        <select className="quiz-start-select" value={timeLimit} onChange={e => setTimeLimit(e.target.value)}>
          {TIME_LIMIT_OPTIONS.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <button
        className="quiz-start-btn"
        disabled={subjects.length === 0}
        onClick={() => onStart({ subjects, numQuestions, timeLimit })}
      >
        START QUIZ
      </button>
    </div>
  );
};

const Quiz = () => {
  const [started, setStarted] = useState(false);
  const [quizConfig, setQuizConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const handleStart = (config) => {
    setQuizConfig(config);
    setStarted(true);
    setTimeLeft(parseInt(config.timeLimit) * 60);
  };

  // Fetch questions when quiz starts
  useEffect(() => {
    if (!started || !quizConfig) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.append("num_ques", quizConfig.numQuestions);
    quizConfig.subjects.forEach(s => params.append("subjects", s));
    fetch(`http://localhost:8000/get-quiz-questions/?${params.toString()}`, { method: "POST" })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [started, quizConfig]);

  // Countdown timer — starts after questions load
  useEffect(() => {
    if (!started || loading || finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, loading, finished]);

  const handleNext = () => {
    const q = questions[currentIndex];
    const isCorrect = selected !== null && OPTION_LABELS[selected] === q.correct_option;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);
    setStreak(isCorrect ? s => s + 1 : 0);

    if (currentIndex + 1 >= questions.length) {
      clearInterval(timerRef.current);
      setFinished(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  // ── Start screen ──
  if (!started) {
    return <QuizStart onStart={handleStart} />;
  }

  // ── Loading screen ──
  if (loading) {
    return (
      <div className="quiz-wrapper quiz-center">
        <div className="quiz-status-text">Loading questions…</div>
      </div>
    );
  }

  // ── Error screen ──
  if (error) {
    return (
      <div className="quiz-wrapper quiz-center">
        <div className="quiz-status-text quiz-error-text">Error: {error}</div>
        <button className="quiz-start-btn" style={{ marginTop: 12 }} onClick={() => { setStarted(false); setError(null); }}>
          Try Again
        </button>
      </div>
    );
  }

  // ── No questions found ──
  if (!loading && questions.length === 0) {
    return (
      <div className="quiz-wrapper quiz-center">
        <div className="quiz-status-text">No questions found for the selected subject.</div>
        <button className="quiz-start-btn" style={{ marginTop: 12 }} onClick={() => setStarted(false)}>
          Go Back
        </button>
      </div>
    );
  }

  // ── Results screen ──
  if (finished) {
    const score = answers.filter((ans, i) => ans !== null && questions[i] && OPTION_LABELS[ans] === questions[i].correct_option).length;
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="quiz-wrapper quiz-center" style={{ padding: 24 }}>
        <div className="quiz-result-title">Quiz Complete! 🎉</div>
        <div className="quiz-result-score">{score} / {questions.length}</div>
        <div className="quiz-result-pct">{pct}% correct</div>
        <div className="quiz-progress-track" style={{ width: "80%", margin: "16px 0" }}>
          <div className="quiz-progress-fill" style={{ width: `${pct}%`, transition: "width 0.8s ease" }} />
        </div>
        <button className="quiz-start-btn" style={{ marginTop: 8 }} onClick={() => {
          setStarted(false); setFinished(false); setQuestions([]); setCurrentIndex(0);
          setAnswers([]); setStreak(0); setSelected(null);
        }}>
          Play Again
        </button>
      </div>
    );
  }

  // ── Question screen ──
  const q = questions[currentIndex];
  const progressPct = (currentIndex / questions.length) * 100;
  const opts = [q.optionA, q.optionB, q.optionC, q.optionD];

  return (
    <div className="quiz-wrapper">
      {/* Header bar */}
      <div className="quiz-top-bar">
        <div className="quiz-question-counter">Question {currentIndex + 1}/{questions.length}</div>
        <div className="quiz-streak-label">Streak</div>
        <div className="quiz-streak-value">🔥 {streak}</div>
        <div className="quiz-top-bar-spacer" />
        <div className="quiz-timer-box">
          <span className="quiz-timer-text">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="quiz-progress-track">
        <div className="quiz-progress-fill" style={{ width: `${progressPct}%`, transition: "width 0.4s ease" }} />
      </div>

      {/* Language toggle */}
      {/* <div className="quiz-lang-toggle">
        <div className="quiz-lang-btn hindi"><span>हिंदी</span></div>
        <div className="quiz-lang-btn english"><span>English</span></div>
      </div> */}

      {/* Question text */}
      <div className="quiz-question-box">
        <div className="quiz-question-text"><MathText text={q.question} /></div>
      </div>

      {/* Options */}
      <div className="quiz-options">
        {opts.map((opt, idx) => (
          <div
            key={idx}
            onClick={() => setSelected(idx)}
            className={`quiz-option${selected === idx ? " selected" : ""}`}
          >
            ({OPTION_LABELS[idx]}) <MathText text={opt} />
          </div>
        ))}
      </div>

      {/* Next / Finish button */}
      <div className="quiz-footer">
        <div className="quiz-next-btn" onClick={handleNext}>
          <span>{currentIndex + 1 >= questions.length ? "Finish" : "Next"}</span>
        </div>
      </div>
    </div>
  );
};

export default Quiz;