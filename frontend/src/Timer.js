import React, { useState, useRef, useEffect } from 'react';

const DEFAULT_HOURS = 0;
const DEFAULT_MINUTES = 25;
const DEFAULT_SECONDS = 0;

function pad(n) {
  return String(n).padStart(2, '0');
}

function Timer() {
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [seconds, setSeconds] = useState(DEFAULT_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [editing, setEditing] = useState(null); // 'h' | 'm' | 's' | null
  const [editVal, setEditVal] = useState('');
  const intervalRef = useRef(null);

  // Calculate total and remaining seconds
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const [remaining, setRemaining] = useState(totalSeconds);

  // Sync remaining when time fields change and not running
  useEffect(() => {
    if (!isRunning) setRemaining(hours * 3600 + minutes * 60 + seconds);
    // eslint-disable-next-line
  }, [hours, minutes, seconds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev > 0) return prev - 1;
          clearInterval(intervalRef.current);
          setIsRunning(false);
          return 0;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // When timer finishes, update fields
  useEffect(() => {
    if (!isRunning && remaining !== hours * 3600 + minutes * 60 + seconds) {
      setHours(Math.floor(remaining / 3600));
      setMinutes(Math.floor((remaining % 3600) / 60));
      setSeconds(remaining % 60);
    }
    // eslint-disable-next-line
  }, [remaining, isRunning]);

  // Compute display values from remaining for real-time update
  const displayHours = Math.floor(remaining / 3600);
  const displayMinutes = Math.floor((remaining % 3600) / 60);
  const displaySeconds = remaining % 60;

  const handleStart = () => {
    if (!isRunning && remaining > 0) setIsRunning(true);
  };
  const handleStop = () => {
    setIsRunning(false);
  };
  const handleReset = () => {
    setIsRunning(false);
    setHours(DEFAULT_HOURS);
    setMinutes(DEFAULT_MINUTES);
    setSeconds(DEFAULT_SECONDS);
    setRemaining(DEFAULT_HOURS * 3600 + DEFAULT_MINUTES * 60 + DEFAULT_SECONDS);
  };

  // Inline edit handlers
  const handleEdit = (type, val) => {
    setEditing(type);
    setEditVal(pad(val));
  };
  const handleEditChange = e => {
    setEditVal(e.target.value.replace(/\D/g, '').slice(0, 2));
  };
  const handleEditBlur = () => {
    let v = Math.max(0, Math.min(99, parseInt(editVal) || 0));
    if (editing === 'h') setHours(v);
    if (editing === 'm') setMinutes(Math.min(59, v));
    if (editing === 's') setSeconds(Math.min(59, v));
    setEditing(null);
  };
  const handleEditKey = e => {
    if (e.key === 'Enter') handleEditBlur();
  };

  const progress = totalSeconds === 0 ? 0 : remaining / totalSeconds;

  const CARD_W = 200;
  const CARD_H = 106;
  const STROKE = 2;
  const RX = 8;
  // Perimeter of the rounded rect (approx, ignoring corner arc difference)
  const PERIMETER = 2 * (CARD_W - STROKE + CARD_H - STROKE);
  const borderOffset = PERIMETER * (1 - progress);

  return (
    <div style={{
      width: CARD_W, height: CARD_H, background: '#f2f6f9', borderRadius: 9,
      boxShadow: '8px 8px 20px rgba(0,0,0,0.08), -6px -6px 15px rgba(255,255,255,0.8)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '16px 19px', margin: '0 auto', boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Rectangular border progress */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: CARD_W, height: CARD_H, pointerEvents: 'none' }}>
        <rect
          x={STROKE / 2} y={STROKE / 2}
          width={CARD_W - STROKE} height={CARD_H - STROKE}
          rx={RX} ry={RX}
          fill="transparent"
          stroke="#d9e6f2"
          strokeWidth={STROKE}
        />
        <rect
          x={STROKE / 2} y={STROKE / 2}
          width={CARD_W - STROKE} height={CARD_H - STROKE}
          rx={RX} ry={RX}
          fill="transparent"
          stroke="#2f8cff"
          strokeWidth={STROKE}
          strokeDasharray={PERIMETER}
          strokeDashoffset={borderOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div style={{ fontSize: 8, letterSpacing: 2, color: '#6c7a89', marginBottom: 9, fontWeight: 600, zIndex: 1, position: 'relative' }}>TIMER</div>
      <div style={{ fontSize: 25, fontWeight: 600, color: '#444', margin: '6px 0 12px 0', display: 'flex', alignItems: 'center', gap: 4, zIndex: 1, position: 'relative' }}>
        {/* Editable Hours */}
        {editing === 'h' ? (
          <input
            type="text"
            value={editVal}
            onChange={handleEditChange}
            onBlur={handleEditBlur}
            onKeyDown={handleEditKey}
            style={{
              width: 21, fontSize: 22, fontWeight: 600, textAlign: 'center', border: 'none', borderRadius: 5,
              background: '#e6eef3', color: '#444', outline: '2px solid #2f8cff', marginRight: 1
            }}
            autoFocus
          />
        ) : (
          <span
            style={{ cursor: isRunning ? 'not-allowed' : 'pointer', borderRadius: 5, background: '#e6eef3', padding: '1px 5px', marginRight: 1 }}
            onClick={() => !isRunning && handleEdit('h', displayHours)}
            title="Edit hours"
          >{pad(displayHours)}</span>
        )}
        <span>:</span>
        {/* Editable Minutes */}
        {editing === 'm' ? (
          <input
            type="text"
            value={editVal}
            onChange={handleEditChange}
            onBlur={handleEditBlur}
            onKeyDown={handleEditKey}
            style={{
              width: 21, fontSize: 22, fontWeight: 600, textAlign: 'center', border: 'none', borderRadius: 5,
              background: '#e6eef3', color: '#444', outline: '2px solid #2f8cff', marginRight: 1
            }}
            autoFocus
          />
        ) : (
          <span
            style={{ cursor: isRunning ? 'not-allowed' : 'pointer', borderRadius: 5, background: '#e6eef3', padding: '1px 5px', marginRight: 1 }}
            onClick={() => !isRunning && handleEdit('m', displayMinutes)}
            title="Edit minutes"
          >{pad(displayMinutes)}</span>
        )}
        <span>:</span>
        {/* Editable Seconds */}
        {editing === 's' ? (
          <input
            type="text"
            value={editVal}
            onChange={handleEditChange}
            onBlur={handleEditBlur}
            onKeyDown={handleEditKey}
            style={{
              width: 21, fontSize: 22, fontWeight: 600, textAlign: 'center', border: 'none', borderRadius: 5,
              background: '#e6eef3', color: '#444', outline: '2px solid #2f8cff', marginRight: 1
            }}
            autoFocus
          />
        ) : (
          <span
            style={{ cursor: isRunning ? 'not-allowed' : 'pointer', borderRadius: 5, background: '#e6eef3', padding: '1px 5px', marginRight: 1 }}
            onClick={() => !isRunning && handleEdit('s', displaySeconds)}
            title="Edit seconds"
          >{pad(displaySeconds)}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 9, zIndex: 1, position: 'relative' }}>
        {isRunning ? (
          <button
            onClick={handleStop}
            style={{
              padding: '5px 11px', fontSize: 10, border: 'none', borderRadius: 6, background: '#fff',
              boxShadow: '3px 3px 8px rgba(0,0,0,0.1)', cursor: 'pointer', fontWeight: 500, transition: '0.2s'
            }}
          >STOP</button>
        ) : (
          <button
            onClick={handleStart}
            style={{
              padding: '5px 11px', fontSize: 10, border: 'none', borderRadius: 6, background: '#fff',
              boxShadow: '3px 3px 8px rgba(0,0,0,0.1)', cursor: 'pointer', fontWeight: 500, transition: '0.2s'
            }}
            disabled={remaining === 0}
          >START</button>
        )}
        <button
          onClick={handleReset}
          style={{
            padding: '5px 11px', fontSize: 10, border: 'none', borderRadius: 6, background: '#fff',
            boxShadow: '3px 3px 8px rgba(0,0,0,0.1)', cursor: 'pointer', fontWeight: 500, transition: '0.2s'
          }}
        >RESET</button>
      </div>
    </div>
  );
}

export default Timer;
