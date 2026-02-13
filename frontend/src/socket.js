import { io } from "socket.io-client";

const SERVER_URL = window.location.hostname === "localhost" 
    ? "http://localhost:3000"
    : "https://tic-tac-toe-app-backend-i1z5.onrender.com";

export const socket = io(SERVER_URL);