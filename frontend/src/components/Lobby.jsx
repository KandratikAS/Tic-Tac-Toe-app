import { socket } from "../socket";

export default function Lobby({ games, name }) {
  const createSession = (gameType = "tic-tac-toe") => {
    socket.emit("createSession", { name, gameType });
  };

  const joinSession = (id) => {
    socket.emit("joinSession", { id, name });
  };

  return (
    <div className="card lobby-card">
      <h2 className="lobby-title">🎲 Lobby</h2>

      {/* Создать новую игру */}
      <div className="create-game">
        <button className="primary-btn" onClick={() => createSession("tic-tac-toe")}>
          ➕ Create Tic-Tac-Toe Game
        </button>
        {/* Можно добавлять другие игры позже */}
        {/* <button className="primary-btn" onClick={() => createSession("connect4")}>
          ➕ Create Connect-4 Game
        </button> */}
      </div>

      {/* Список сессий */}
      <div className="list">
        {Object.entries(games).map(([id, game]) => (
          <div key={id} className="session">
            <div>
              <strong>Game #{id}</strong> — {game.gameType || "Tic-Tac-Toe"} | Players: {game.players.length}/2
            </div>
            {game.players.length < 2 ? (
              <button className="join-btn" onClick={() => joinSession(id)}>Join</button>
            ) : (
              <span className="full-label">Full</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
