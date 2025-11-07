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
        <form
            onSubmit={handleSubmit}
            className="flex rounded bg-black text-white"
        >
            <input
                type="text"
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setValue(e.target.value)
                }
                className="p-2 outline-none w-full"
            />
            <button type="submit" disabled={isLoading} className="p-2">
                Submit
            </button>
        </form>
    );
};

export default MyForm;
