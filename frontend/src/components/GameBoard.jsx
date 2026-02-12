import { socket } from "../socket";

export default function GameBoard({ board, gameId }) {
  const handleClick = (index) => {
    if (!board[index]) socket.emit("move", { id: gameId, index });
  };

  return (
    <div className="card game-card">
      <h2 className="game-title">🎮 Game #{gameId}</h2>
      <div className="grid">
        {board.map((cell, idx) => (
          <div
            key={idx}
            className={`cell ${cell ? "filled" : ""}`}
            onClick={() => handleClick(idx)}
          >
            {cell}
          </div>
        ))}
      </div>
    </div>
  );
}
