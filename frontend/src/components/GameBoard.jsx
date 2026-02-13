import { socket } from "../socket";
import "../App.css";

export default function GameBoard({ board, gameId, isGameOver, winLine = [] }) {
  const handleClick = (index) => {
    if (!board[index] && !isGameOver) socket.emit("move", { id: gameId, index });
  };

  const isWinCell = (idx) => winLine.includes(idx);

  function getRotation(line) {
    const combos = {
      "0,1,2": "0deg",
      "3,4,5": "0deg",
      "6,7,8": "0deg",
      "0,3,6": "90deg",
      "1,4,7": "90deg",
      "2,5,8": "90deg",
      "0,4,8": "45deg",
      "2,4,6": "-45deg",
    };
    return combos[line.join(",")] || "0deg";
  }

  return (
    <div className="card game-card">
      <h2 className="game-title">🎮 Game #{gameId}</h2>
      <div className="grid">
        {board.map((cell, idx) => (
          <div
            key={idx}
            className={`cell ${isWinCell(idx) ? "win-cell" : ""}`}
            onClick={() => handleClick(idx)}
            style={isWinCell(idx) ? { "--rotation": getRotation(winLine) } : {}}
          >
            {cell === "X" && <div className="symbol x"></div>}
            {cell === "O" && <div className="symbol o"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
