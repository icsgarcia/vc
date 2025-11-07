import { useState } from "react";
import { type Messages } from "../pages/Room";

const Events = ({ events }: { events: Messages[] }) => {
    const [showDateIndex, setShowDateIndex] = useState<number | null>(null);

    const toggleDate = (index: number) => {
        setShowDateIndex(showDateIndex === index ? null : index);
    };
    return (
        <>
            {events.map((event: Messages, index) => (
                <div key={index} className="mb-4 text-white">
                    <p className="mb-2 text-sm">{event.username}</p>
                    <p
                        onClick={() => toggleDate(index)}
                        className="bg-black/50 p-2 px-3 rounded-full inline"
                    >
                        {event.message}
                    </p>
                    {showDateIndex === index && (
                        <p className="text-xs mt-2">
                            {new Date(event.date).toLocaleString()}
                        </p>
                    )}
                </div>
            ))}
        </>
    );
};

export default Events;
