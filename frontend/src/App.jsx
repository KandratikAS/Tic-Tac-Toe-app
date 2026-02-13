import { useState, useEffect } from "react";
import { socket } from "./socket";
import Login from "./components/Login.jsx";
import Lobby from "./components/Lobby.jsx";
import GameBoard from "./components/GameBoard.jsx";
import Stats from "./components/Stats.jsx"; 
import confetti from "canvas-confetti";
import "./App.css";

export default function App() {
  const [name, setName] = useState("");
  const [games, setGames] = useState({});
  const [board, setBoard] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [mySymbol, setMySymbol] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winLine, setWinLine] = useState([]);
  const [stats, setStats] = useState({}); 

  useEffect(() => {
    socket.on("sessionList", setGames);

    socket.on("joined", (d) => {
      setGameId(d.id);
      setMySymbol(d.symbol);
      setIsGameOver(false);
      setWinLine([]);
    });

    socket.on("start", (g) => {
      setBoard(g.board);
      setIsGameOver(false);
      setWinLine([]);
    });

    socket.on("update", (g) => setBoard(g.board));

    socket.on("end", ({ winner, line, board: b, stats: s }) => {
      setBoard(b);
      setIsGameOver(true);
      setStats(s); 
      if (winner && line) setWinLine(line);
      launchConfetti();
    });

    return () => {
      socket.off("sessionList", setGames);
      socket.off("joined");
      socket.off("start");
      socket.off("update");
      socket.off("end");
    };
  }, []);

  function launchConfetti() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      });
    }, 250);
  }

 return (
  <div className="full-screen-container">
    {!name ? (
      <Login setName={setName} />
    ) : !board ? (
      <Lobby games={games} name={name} /> 
    ) : (
<div className="game-area">
  <GameBoard
    board={board}
    gameId={gameId}
    mySymbol={mySymbol}
    isGameOver={isGameOver}
    winLine={winLine}
  />
  <Stats stats={stats} currentPlayer={name} />
</div>
    )}
  </div>
);
}
