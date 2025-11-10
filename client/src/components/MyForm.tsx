import { useState, type ChangeEvent, type FormEvent } from "react";
import { socket } from "../socket";

const MyForm = () => {
    const [value, setValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        socket.emit("send-message", value);
        setValue("");
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="text"
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setValue(e.target.value)
                }
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500"
            />
            <button
                type="submit"
                disabled={isLoading || !value.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg p-2 sm:p-3 transition-colors disabled:cursor-not-allowed flex-shrink-0"
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
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                </svg>
            </button>
        </form>
    );
};

export default MyForm;
