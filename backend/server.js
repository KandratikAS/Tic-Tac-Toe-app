import express from "express";
import http from "http";
import { Server } from "socket.io";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const statsFile = path.join(__dirname, "stats.json");
let stats = {};
try {
  const data = fs.readFileSync(statsFile, "utf-8");
  stats = JSON.parse(data);
  console.log("Statistics loaded:", stats);
} catch (e) {
  console.log("No stats.json found, starting fresh.");
  stats = {};
}
function saveStats() {
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
}
function createStats(name) {
  if (!stats[name]) {
    stats[name] = { wins: 0, losses: 0, draws: 0 };
    saveStats();
  }
}

let sessions = {};

function checkWin(board) {
  const w = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of w) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a,b,c] };
    }
  }
  return null;
}

function finishGame(id, win, line = null) {
  const game = sessions[id];
  if (!game) return;

  if (win) {
    const winner = game.players.find(p => p.symbol === win);
    const loser = game.players.find(p => p.symbol !== win);
    if (winner && loser) {
      stats[winner.name].wins++;
      stats[loser.name].losses++;
      saveStats();
    }
  } else {
    game.players.forEach(p => stats[p.name].draws++);
    saveStats();
  }

  io.to(id).emit("end", { winner: win, line, stats, board: game.board });
  delete sessions[id];
  io.emit("sessionList", sessions);
}

function getPlayerSymbol(socketId, game) {
  const player = game.players.find(p => p.id === socketId);
  return player?.symbol;
}

io.on("connection", socket => {
  console.log("New connection:", socket.id);

  socket.on("createSession", ({ name }) => {
    createStats(name);
    const id = randomUUID().slice(0,6);
    sessions[id] = {
      players: [{ id: socket.id, name, symbol: "X" }],
      board: Array(9).fill(null),
      turn: "X"
    };
    socket.join(id);
    socket.emit("joined", { id, symbol: "X" });
    io.emit("sessionList", sessions);
    console.log(`${name} created session ${id}`);
  });

  // Присоединение ко второй позиции
  socket.on("joinSession", ({ id, name }) => {
    const game = sessions[id];
    if (!game) {
      console.log(`Session ${id} not found`);
      return;
    }

    if (game.players.length >= 2) {
      console.log(`Session ${id} is already full`);
      socket.emit("sessionFull", { id });
      return;
    }

    if (game.players.find(p => p.id === socket.id)) {
      console.log(`${name} already in session ${id}`);
      return;
    }

    createStats(name);
    const newPlayer = { id: socket.id, name, symbol: "O" };
    game.players.push(newPlayer);
    socket.join(id);

    console.log(`${name} joined session ${id} as O`);

    socket.emit("joined", { id, symbol: "O" });
    socket.emit("start", game);

    const firstPlayer = game.players.find(p => p.symbol === "X");
    if (firstPlayer) {
      io.to(firstPlayer.id).emit("start", game);
    }

    io.emit("sessionList", sessions);
  });

  socket.on("move", ({ id, index }) => {
    const game = sessions[id];
    if (!game) return;

    const playerSymbol = getPlayerSymbol(socket.id, game);
    if (!playerSymbol || game.board[index] !== null || game.turn !== playerSymbol) return;

    game.board[index] = playerSymbol;
    const result = checkWin(game.board);
    const win = result?.winner;
    const line = result?.line;

    if (win || !game.board.includes(null)) {
      finishGame(id, win, line);
    } else {
      game.turn = game.turn === "X" ? "O" : "X";
      io.to(id).emit("update", game);
    }
  });

  socket.on("disconnect", () => {
    for (const id in sessions) {
      const game = sessions[id];
      const idx = game.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        game.players.splice(idx, 1);

        if (game.players.length === 1) {
          const remaining = game.players[0];
          stats[remaining.name].wins++;
          saveStats();
          io.to(id).emit("end", { winner: remaining.symbol, line: null, stats, board: game.board });
          delete sessions[id];
        } else if (game.players.length === 0) {
          delete sessions[id];
        } else {
          io.to(id).emit("update", game);
        }
      }
    }
    io.emit("sessionList", sessions);
  });
});

const buildPath = path.join(__dirname, "frontend");
app.use(express.static(buildPath));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
