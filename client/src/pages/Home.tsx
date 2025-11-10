import { useNavigate } from "react-router";
import { socket } from "../socket";
import { useState, type ChangeEvent } from "react";

const Home = () => {
    const [username, setUsername] = useState("");
    const [isClicked, setIsClicked] = useState(false);
    const navigate = useNavigate();

    const rooms = [
        { id: 1, name: "room 1" },
        { id: 2, name: "room 2" },
        { id: 3, name: "room 3" },
    ];

    const joinRoom = (roomId: number) => {
        socket.connect();
        socket.emit("join-room", username, roomId);
        navigate(`room/${roomId}`, { state: { username } });
    };
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                    <svg
                        className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3">
                    Video Call
                </h1>
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg">
                    Connect with anyone, anywhere
                </p>
            </div>

            {isClicked ? (
                <div className="w-full max-w-6xl px-2">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/50">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-white">
                                Available Rooms
                            </h2>
                            <button
                                onClick={() => setIsClicked(false)}
                                className="text-gray-400 hover:text-white transition-colors p-2"
                            >
                                <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {rooms.map((room) => (
                                <button
                                    key={room.id}
                                    onClick={() => joinRoom(room.id)}
                                    className="group relative bg-gradient-to-br from-gray-700 to-gray-800 hover:from-blue-600 hover:to-blue-700 p-6 sm:p-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-gray-600 hover:border-blue-500"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-600 group-hover:bg-blue-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                                            <svg
                                                className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 capitalize">
                                            {room.name}
                                        </h3>
                                        <p className="text-gray-400 group-hover:text-blue-200 text-xs sm:text-sm">
                                            Click to join
                                        </p>
                                    </div>
                                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-md px-4">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-700/50">
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">
                            Enter Your Name
                        </h2>
                        <div className="space-y-4 sm:space-y-6">
                            <div>
                                <label className="block text-gray-400 mb-2 text-xs sm:text-sm font-medium">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>
                                    ) => setUsername(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 sm:p-4 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (username.trim() !== "")
                                        setIsClicked(true);
                                }}
                                disabled={username.trim() === ""}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Continue to Rooms
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="absolute bottom-4 sm:bottom-8 text-center text-gray-500 text-xs sm:text-sm">
                <p>Secure • Private • Fast</p>
            </div>
        </main>
    );
};

export default Home;
