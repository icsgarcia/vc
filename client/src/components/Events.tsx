import { useState } from "react";
import { type Messages } from "../pages/Room";

const Events = ({ events }: { events: Messages[] }) => {
    const [showDateIndex, setShowDateIndex] = useState<number | null>(null);

    const toggleDate = (index: number) => {
        setShowDateIndex(showDateIndex === index ? null : index);
    };
    return (
        <div className="space-y-3 sm:space-y-4">
            {events.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                    <svg
                        className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                    <p className="text-gray-500 text-sm sm:text-base">
                        No messages yet
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                        Start the conversation!
                    </p>
                </div>
            ) : (
                events.map((event: Messages, index) => (
                    <div key={index} className="group">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                                {event.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                                        {event.username}
                                    </p>
                                    <button
                                        onClick={() => toggleDate(index)}
                                        className="text-xs text-gray-500 hover:text-gray-400 transition-colors shrink-0"
                                    >
                                        {showDateIndex === index
                                            ? "hide"
                                            : "time"}
                                    </button>
                                </div>
                                <div className="bg-gray-700 text-white p-2 sm:p-3 rounded-lg rounded-tl-none inline-block max-w-full break-words">
                                    <p className="text-xs sm:text-sm">
                                        {event.message}
                                    </p>
                                </div>
                                {showDateIndex === index && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(event.date).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default Events;
