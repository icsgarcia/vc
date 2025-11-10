import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Parse CORS origins (comma-separated)
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : ["http://localhost:5173"];

const io = new Server(server, {
    connectionStateRecovery: {},
    cors: {
        origin: corsOrigins,
        credentials: true,
    },
});
const port = process.env.PORT || 3000;

// Track users in each room
const rooms = new Map();

app.get("/", (req, res) => {
    res.send("Hello World!");
});

io.on("connection", (socket) => {
    let currentUsername = "";
    let currentRoom = "";

    console.log("User connected:", socket.id);

    socket.on("join-room", (username, room) => {
        currentUsername = username;
        currentRoom = room;
        socket.join(room);

        // Initialize room if it doesn't exist
        if (!rooms.has(room)) {
            rooms.set(room, new Set());
        }

        const roomUsers = rooms.get(room);
        const isFirstUser = roomUsers.size === 0;

        // Add user to room
        roomUsers.add(socket.id);

        console.log(
            `${username} joined room: ${room}, isFirst: ${isFirstUser}, total users: ${roomUsers.size}`
        );

        // Tell the joining user if they're first or not
        socket.emit("user-joined", { isFirst: isFirstUser });

        // If not first user, tell the existing user(s) to prepare for connection
        if (!isFirstUser) {
            socket.to(currentRoom).emit("ready-to-call");
        }
    });

    socket.on("send-message", (message) => {
        console.log(`Message from ${currentUsername}: ${message}`);
        io.to(currentRoom).emit("chat-message", {
            message,
            username: currentUsername,
            date: new Date(),
        });
    });

    socket.on("offer", (offer) => {
        console.log(`Offer from ${currentUsername} in room ${currentRoom}`);
        socket.to(currentRoom).emit("offer", offer);
    });

    socket.on("answer", (answer) => {
        console.log(`Answer from ${currentUsername} in room ${currentRoom}`);
        socket.to(currentRoom).emit("answer", answer);
    });

    socket.on("ice-candidate", (candidate) => {
        console.log(`ICE candidate from ${currentUsername}`);
        socket.to(currentRoom).emit("ice-candidate", candidate);
    });

    socket.on("disconnect", () => {
        console.log(
            `User ${currentUsername} disconnected from room ${currentRoom}`
        );

        // Remove user from room
        if (rooms.has(currentRoom)) {
            const roomUsers = rooms.get(currentRoom);
            roomUsers.delete(socket.id);

            // Clean up empty rooms
            if (roomUsers.size === 0) {
                rooms.delete(currentRoom);
                console.log(`Room ${currentRoom} is now empty and removed`);
            } else {
                console.log(
                    `Room ${currentRoom} has ${roomUsers.size} users remaining`
                );
            }
        }

        socket.to(currentRoom).emit("user-left", {
            username: currentUsername,
            socketId: socket.id,
        });
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Allowed CORS origins:`, corsOrigins);
});
