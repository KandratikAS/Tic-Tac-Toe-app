import { useState } from "react";

export default function Login({ setName }) {
  const [input, setInput] = useState("");

  return (
    <div className="card login-card">
      <h1 className="login-title">🎮 Tic-Tac-Toe Online</h1>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your nickname"
        className="login-input"
      />
      <button
        className="login-btn"
        onClick={() => input.trim() && setName(input)}
      >
        Start Playing
      </button>
    </div>
  );
}
