import React, { useState } from "react";

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { text: input, done: false }]);
      setInput("");
    }
  };

  const toggleTodo = idx => {
    setTodos(todos =>
      todos.map((todo, i) =>
        i === idx ? { ...todo, done: !todo.done } : todo
      )
    );
  };

  const removeTodo = idx => {
    setTodos(todos => todos.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ padding: "1em" }}>
      <h3 style={{ marginBottom: "0.5em" }}>Todo List</h3>
      <div style={{ display: "flex", gap: "0.5em", marginBottom: "1em" }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a task..."
          style={{ flex: 1, padding: "0.5em" }}
          onKeyDown={e => e.key === "Enter" && addTodo()}
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {todos.map((todo, idx) => (
          <li
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "0.5em"
            }}
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(idx)}
              style={{ marginRight: "0.5em" }}
            />
            <span
              style={{
                textDecoration: todo.done ? "line-through" : "none",
                flex: 1
              }}
            >
              {todo.text}
            </span>
            <button
              onClick={() => removeTodo(idx)}
              style={{
                marginLeft: "0.5em",
                background: "#eee",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;