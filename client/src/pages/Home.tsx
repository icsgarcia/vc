import { useNavigate } from "react-router";
import { socket } from "../socket";
import { useState, type ChangeEvent } from "react";

const Home = () => {
    const [username, setUsername] = useState("");
    const [room, setRoom] = useState("");
    const [isClicked, setIsClicked] = useState(false);
    const navigate = useNavigate();

    const joinRoom = () => {
        const roomName = "room1";
        setRoom(roomName);
        socket.connect();
        socket.emit("join-room", username, roomName);
        navigate("/room");
    };
    return (
        <main className="flex flex-col items-center justify-center min-h-screen gap-4 bg-black/95">
            {isClicked ? (
                <button
                    onClick={joinRoom}
                    className="border p-2 rounded cursor-pointer bg-white"
                >
                    Room 1
                </button>
            ) : (
                <div className="border rounded p-4 flex flex-col gap-8 bg-white">
                    <input
                        type="text"
                        value={username}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setUsername(e.target.value)
                        }
                        className="border rounded p-2"
                    />
                    <button
                        onClick={() => {
                            if (username !== "") setIsClicked(true);
                        }}
                        className="rounded border py-2 px-4 cursor-pointer"
                    >
                        Check rooms
                    </button>
                </div>
            )}
        </main>
    );
};

export default Home;
