import express from "express";
import http from "http";
import { Server } from "socket.io";
import { randomUUID } from "crypto";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

let sessions = {}; // {id: {players:[{id,name,symbol}], board:Array(9), turn, gameType}}
let stats = {};    // {name:{wins,losses,draws}}

// Создаём статистику для игрока
function createStats(name) {
  if (!stats[name]) stats[name] = { wins: 0, losses: 0, draws: 0 };
}

// Проверка победы
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

// Завершение игры
function finishGame(id, win, line = null) {
  const game = sessions[id];
  if (!game) return;

  if (win) {
    const winner = game.players.find(p => p.symbol === win);
    const loser = game.players.find(p => p.symbol !== win);
    if (winner && loser) {
      stats[winner.name].wins++;
      stats[loser.name].losses++;
    }
  } else {
    game.players.forEach(p => stats[p.name].draws++);
  }

  // Отправляем событие end с линией победы
  io.to(id).emit("end", { winner: win, line, stats, board: game.board });

  delete sessions[id];
  io.emit("sessionList", sessions);
}

// Получаем символ игрока по socket.id
function getPlayerSymbol(socketId, game) {
  const player = game.players.find(p => p.id === socketId);
  return player?.symbol;
}

io.on("connection", socket => {
  console.log("New connection:", socket.id);

  // Создание новой сессии
  socket.on("createSession", ({ name, gameType="tic-tac-toe" }) => {
    createStats(name);
    const id = randomUUID().slice(0,6);
    sessions[id] = {
      players: [{ id: socket.id, name, symbol: "X" }],
      board: Array(9).fill(null),
      turn: "X",
      gameType
    };
    socket.join(id);
    console.log(`Session created: ${id} by ${name}`);
    socket.emit("joined", { id, symbol: "X", board: sessions[id].board });
    io.emit("sessionList", sessions);
  });

  // Присоединение к существующей сессии
  socket.on("joinSession", ({ id, name }) => {
    const game = sessions[id];
    if (!game) {
      console.log(`Join failed: session ${id} not found`);
      return;
    }
    if (game.players.length >= 2) {
      console.log(`Join failed: session ${id} full`);
      return;
    }
    if (game.players.find(p => p.id === socket.id)) {
      console.log(`Join failed: player ${socket.id} already in session`);
      return;
    }

    createStats(name);
    const newPlayer = { id: socket.id, name, symbol: "O" };
    game.players.push(newPlayer);
    socket.join(id);

    console.log(`${name} joined session ${id} as O`);

    // Отправляем каждому игроку его символ
    socket.emit("joined", { id, symbol: "O", board: game.board });
    const firstPlayer = game.players.find(p => p.symbol === "X");
    if (firstPlayer) {
      io.to(firstPlayer.id).emit("joined", { id, symbol: "X", board: game.board });
    }

    // Старт игры для обоих
    io.to(id).emit("start", game);
    io.emit("sessionList", sessions);
  });

  // Ход игрока
  socket.on("move", ({ id, index }) => {
    const game = sessions[id];
    if (!game) return;

    const playerSymbol = getPlayerSymbol(socket.id, game);
    if (!playerSymbol) return;
    if (game.board[index] !== null) return;
    if (game.turn !== playerSymbol) return;

    // Ставим символ
    game.board[index] = playerSymbol;

    // Проверяем победителя один раз
    const result = checkWin(game.board);
    const win = result?.winner;
    const line = result?.line;

    if (win || !game.board.includes(null)) {
      // Завершаем игру и передаем линию победы
      finishGame(id, win, line);
    } else {
      // Меняем очередь и отправляем обновление
      game.turn = game.turn === "X" ? "O" : "X";
      io.to(id).emit("update", game);
    }
  });

  // Отключение игрока
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    for (const id in sessions) {
      const game = sessions[id];
      const idx = game.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        const disconnected = game.players.splice(idx, 1)[0];
        console.log(`Removing player ${socket.id} (${disconnected.name}) from session ${id}`);

        if (game.players.length === 1) {
          const remaining = game.players[0];
          stats[remaining.name].wins++;
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

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
