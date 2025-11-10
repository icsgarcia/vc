import { io } from "socket.io-client";

// Use environment variable or fallback to localhost
const URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const socket = io(URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
});
