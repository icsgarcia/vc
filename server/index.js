import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {},
    cors: {
        origin: "http://localhost:5173",
    },
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

io.on("connection", (socket) => {
    let currentUsername = "";
    let currentRoom = "";

    socket.on("join-room", (username, room) => {
        currentUsername = username;
        currentRoom = room;
        socket.join(room);
        console.log(`${username} joined room: ${room}`);
    });

    socket.on("send-message", (message) => {
        console.log(`Message received: ${message}`);
        io.to(currentRoom).emit("chat-message", {
            message,
            username: currentUsername,
            date: new Date(),
        });
    });

    socket.on("disconnect", () => {
        console.log(
            `User ${currentUsername} disconnected from the room ${currentRoom}`
        );
    });
});

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
