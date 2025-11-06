import { useEffect, useState } from "react";
import { socket } from "./socket";
import ConnectionState from "./components/ConnectionState";
import Events from "./components/Events";
import ConnectionManager from "./components/ConnectionManager";
import MyForm from "./components/MyForm";

function App() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        function onMessages(value: string) {
            setMessages((prevMessages) => [...prevMessages, value]);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("chat-message", onMessages);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("chat-message", onMessages);
        };
    }, []);
    return (
        <div className="App">
            <ConnectionState isConnected={isConnected} />
            <Events events={messages} />
            <ConnectionManager />
            <MyForm />
        </div>
    );
}

export default App;
