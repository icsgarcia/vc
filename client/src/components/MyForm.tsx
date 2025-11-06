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
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setValue(e.target.value)
                }
            />
            <button type="submit" disabled={isLoading}>
                Submit
            </button>
        </form>
    );
};

export default MyForm;
