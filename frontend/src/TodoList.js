import React, { useState } from "react";

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState("");

  const addTodo = () => {
    setTodos(prev => [...prev, { text: '', done: false }]);
    setEditingIdx(todos.length);
    setEditVal("");
  };

  const toggleTodo = idx => {
    setTodos(todos =>
      todos.map((todo, i) =>
        i === idx ? { ...todo, done: !todo.done } : todo
      )
    );
  };

  return (
    <div style={{
      background: '#FFF7C8',
      borderRadius: 0,
      boxShadow: '3px 3px 3px #e0e0e0',
      width: 200,
      padding: '16px 10px 14px 10px',
      margin: '0 auto',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
      <div style={{ fontSize: 15, fontWeight: 500, textAlign: 'center', marginBottom: 10 }}>To Do List</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}>
        {todos.map((todo, idx) => (
          <li key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(idx)}
                style={{ width: 18, height: 18, marginRight: 7 }}
              />
            </label>
            {editingIdx === idx ? (
              <input
                type="text"
                value={editVal}
                autoFocus
                style={{
                  fontSize: 12, marginLeft: 3, color: '#222', fontWeight: 400,
                  border: 'none', outline: 'none', borderRadius: 3, padding: '2px 4px', width: 90,
                  background: '#fff7c8'
                }}
                onChange={e => setEditVal(e.target.value)}
                onBlur={() => {
                  setTodos(todos => todos.map((t, i) => i === idx ? { ...t, text: editVal } : t));
                  setEditingIdx(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setTodos(todos => todos.map((t, i) => i === idx ? { ...t, text: editVal } : t));
                    setEditingIdx(null);
                  }
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: 12, marginLeft: 3, color: '#222', fontWeight: 400,
                  textDecoration: todo.done ? 'line-through' : 'none',
                  opacity: todo.done ? 0.7 : 1,
                  cursor: 'pointer'
                }}
                onDoubleClick={() => {
                  setEditingIdx(idx);
                  setEditVal(todo.text);
                }}
              >{todo.text || <span style={{ color: '#bbb' }}>New Task</span>}</span>
            )}
            <button
              onClick={() => setTodos(todos => todos.filter((_, i) => i !== idx))}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: 15,
                cursor: 'pointer',
                padding: '0 6px',
                lineHeight: 1,
                fontWeight: 700
              }}
              title="Remove"
            >×</button>
          </li>
        ))}
      </ul>
      <button
        style={{
          marginTop: 12,
          width: '95%',
          padding: '9px 0',
          border: '1.2px solid #bdbdbd',
          borderRadius: 6,
          background: 'transparent',
          color: '#222',
          fontSize: 13,
          fontWeight: 400,
          cursor: 'pointer',
          boxShadow: '0 2px 6px #f3f3f3',
          transition: 'background 0.2s'
        }}
        onClick={addTodo}
      >+ Add Task</button>
    </div>
  );
}

export default TodoList;