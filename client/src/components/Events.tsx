const Events = ({ events }: { events: string[] }) => {
    return (
        <ul>
            {events.map((event, index) => (
                <li key={index}>{event}</li>
            ))}
        </ul>
    );
};

export default Events;
