import { useEffect, useState } from "react";
import { socket } from "../socket";
import GameBoard from "./GameBoard";

export default function Game() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [gameId, setGameId] = useState("");
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    socket.on("joined", ({ id, symbol, board }) => {
      setGameId(id);
      setSymbol(symbol);
      setBoard(board);
    });

    socket.on("start", (game) => {
      setBoard(game.board);
      setGameId(game.id);
    });

    socket.on("update", (game) => {
      setBoard(game.board); // обновляем доску после каждого хода
    });

    socket.on("end", ({ board, winner }) => {
      setBoard(board); // финальный ход
      alert(winner ? `Победил ${winner}` : "Ничья!");
      setGameId(""); // игра завершена
    });

    return () => {
      socket.off("joined");
      socket.off("start");
      socket.off("update");
      socket.off("end");
    };
  }, []);

  return (
    <div>
      <h1>Твой символ: {symbol}</h1>
      {gameId ? (
        <GameBoard board={board} gameId={gameId} />
      ) : (
        <p>Создай или присоединяйся к игре</p>
      )}
    </div>
  );
}
