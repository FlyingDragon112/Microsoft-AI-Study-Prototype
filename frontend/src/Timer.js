import React, { useState, useRef, useEffect } from 'react';

function TimerSegment({ value, onChange, max, disabled }) {
  const inputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState('');
  const pad = n => String(n).padStart(2, '0');

  const startEdit = () => {
    if (disabled) return;
    setEditVal(pad(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const apply = () => {
    let v = Math.max(0, Math.min(max, parseInt(editVal) || 0));
    onChange(v);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="crackit-timer-segment crackit-timer-segment-edit"
        value={editVal}
        onChange={e => setEditVal(e.target.value.replace(/\D/g, '').slice(0, 2))}
        onBlur={apply}
        onKeyDown={e => { if (e.key === 'Enter') apply(); }}
        autoFocus
      />
    );
  }
  return (
    <span className="crackit-timer-segment" onClick={startEdit} title="Click to edit">
      {pad(value)}
    </span>
  );
}

function Timer() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev > 0) return prev - 1;
          setMinutes(m => {
            if (m > 0) return m - 1;
            setHours(h => {
              if (h > 0) return h - 1;
              clearInterval(intervalRef.current);
              setIsRunning(false);
              return 0;
            });
            return m > 0 ? 59 : 59;
          });
          return 59;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    const total = hours * 3600 + minutes * 60 + seconds;
    if (total <= 0) {
      setIsRunning(false);
      clearInterval(intervalRef.current);
    }
  }, [hours, minutes, seconds, isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    setHours(0);
    setMinutes(25);
    setSeconds(0);
  };

  return (
    <div className="crackit-timer">
      <div className="crackit-timer-display">
        <TimerSegment value={hours} onChange={setHours} max={99} disabled={isRunning} />
        <span className="crackit-timer-colon">:</span>
        <TimerSegment value={minutes} onChange={setMinutes} max={59} disabled={isRunning} />
        <span className="crackit-timer-colon">:</span>
        <TimerSegment value={seconds} onChange={setSeconds} max={59} disabled={isRunning} />
      </div>
      <div className="crackit-timer-controls">
        <button onClick={() => setIsRunning(r => !r)} className="crackit-timer-btn">
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button onClick={handleReset} className="crackit-timer-btn">Reset</button>
      </div>
    </div>
  );
}

export default Timer;
