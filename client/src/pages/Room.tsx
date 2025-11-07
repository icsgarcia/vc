import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { socket } from "../socket";
import Events from "../components/Events";
import MyForm from "../components/MyForm";
import { getConnectedDevices, startCamera } from "../webrtc";

export interface Messages {
    username: string;
    message: string;
    date: string;
}

const Room = () => {
    const [messages, setMessages] = useState<Messages[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [openSettings, setOpenSettings] = useState(false);
    const [stream, setStream] = useState<MediaStream | undefined>(undefined);
    const [selectedVideoInput, setSelectedVideoInput] = useState<
        string | undefined
    >(undefined);
    const [selectedAudioInput, setSelectedAudioInput] = useState<
        string | undefined
    >(undefined);
    const [selectedAudioOutput, setSelectedAudioOutput] = useState<
        string | undefined
    >(undefined);
    const [videoInputDevices, setVideoInputDevices] = useState<
        MediaDeviceInfo[]
    >([]);
    const [audioInputDevices, setAudioInputDevices] = useState<
        MediaDeviceInfo[]
    >([]);
    const [audioOutputDevices, setAudioOutputDevices] = useState<
        MediaDeviceInfo[]
    >([]);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        function onMessages({ username, message, date }: Messages) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { username, message, date },
            ]);
        }

        socket.on("chat-message", onMessages);

        return () => {
            socket.off("chat-message", onMessages);
        };
    }, []);

    useEffect(() => {
        const getDevices = async () => {
            setVideoInputDevices(await getConnectedDevices("videoinput"));
            setAudioInputDevices(await getConnectedDevices("audioinput"));
            setAudioOutputDevices(await getConnectedDevices("audiooutput"));
        };
        getDevices();

        return () => {
            setVideoInputDevices([]);
            setAudioInputDevices([]);
            setAudioOutputDevices([]);
        };
    }, []);

    useEffect(() => {
        const handleDeviceChange = async () => {
            setVideoInputDevices(await getConnectedDevices("videoinput"));
            setAudioInputDevices(await getConnectedDevices("audioinput"));
            setAudioOutputDevices(await getConnectedDevices("audiooutput"));
        };

        navigator.mediaDevices.addEventListener(
            "devicechange",
            handleDeviceChange
        );

        return () => {
            navigator.mediaDevices.removeEventListener(
                "devicechange",
                handleDeviceChange
            );
        };
    }, []);

    useEffect(() => {
        const updateStream = async () => {
            try {
                if (isCameraOn && (selectedVideoInput || selectedAudioInput)) {
                    if (stream) {
                        stream.getTracks().forEach((track) => track.stop());
                    }
                    const newStream = await startCamera(
                        videoRef,
                        selectedVideoInput,
                        selectedAudioInput
                    );
                    if (newStream) setStream(newStream);
                }
            } catch (error) {
                console.error("Error updating media stream.", error);
            }
        };
        updateStream();
    }, [isCameraOn, selectedVideoInput, selectedAudioInput]);

    const toggleCamera = async () => {
        try {
            if (isCameraOn) {
                if (stream) {
                    stream.getTracks().forEach((track) => track.stop());
                    setStream(undefined);
                    if (videoRef.current) videoRef.current.srcObject = null;
                }
                setIsCameraOn(false);
            } else {
                const newStream = await startCamera(
                    videoRef,
                    selectedVideoInput,
                    selectedAudioInput
                );
                if (newStream) setStream(newStream);
                setIsCameraOn(true);
            }
        } catch (error) {
            console.error("Error toggling camera.", error);
        }
    };

    const toggleMute = async () => {
        try {
            if (stream) {
                stream
                    .getAudioTracks()
                    .forEach((track) => (track.enabled = !track.enabled));
            }
            setIsMuted(!isMuted);
        } catch (error) {
            console.error("Error toggling mute.", error);
        }
    };

    return (
        <main className="relative min-h-screen w-full flex p-4 bg-black/90 gap-4">
            <div className="w-full bg-gray-700 rounded flex flex-col items-center p-4">
                <div className="flex justify-center items-center mb-4 h-full">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="-scale-x-100"
                    ></video>
                </div>
                <div className="flex gap-2 text-white">
                    <button
                        onClick={toggleMute}
                        className="border rounded p-2 cursor-pointer"
                    >
                        {isMuted ? "Unmute" : "Mute"}
                    </button>
                    <button
                        onClick={toggleCamera}
                        className="border rounded p-2 cursor-pointer"
                    >
                        {isCameraOn ? "Close" : "Open"} Camera
                    </button>
                    <button
                        onClick={() => setOpenSettings(true)}
                        className="border rounded p-2 cursor-pointer"
                    >
                        Settings
                    </button>
                    <button className="border rounded p-2 cursor-pointer">
                        Leave Room
                    </button>
                </div>
            </div>
            <div className="w-[30%] bg-gray-700 p-4 rounded flex flex-col">
                <div className="h-full">
                    <Events events={messages} />
                </div>
                <div>
                    <MyForm />
                </div>
            </div>

            {/* modal */}
            {openSettings && (
                <div
                    onClick={() => setOpenSettings(false)}
                    className="absolute inset-0 w-full h-full bg-black/50 z-50 flex justify-center items-center"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-white p-4"
                    >
                        <div className="flex items-center justify-evenly">
                            <p>Video Input</p>
                            <select
                                name="videoInput"
                                id="videoInput"
                                value={selectedVideoInput}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                    setSelectedVideoInput(e.target.value)
                                }
                                className="border p-2 rounded"
                            >
                                {videoInputDevices.map((videoInput) => (
                                    <option
                                        value={videoInput.deviceId}
                                        key={videoInput.deviceId}
                                    >
                                        {videoInput.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center justify-evenly">
                            <p>Audio Input</p>
                            <select
                                name="audioInput"
                                id="audioInput"
                                value={selectedAudioInput}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                    setSelectedAudioInput(e.target.value)
                                }
                                className="border p-2 rounded"
                            >
                                {audioInputDevices.map((audioInput) => (
                                    <option
                                        value={audioInput.deviceId}
                                        key={audioInput.deviceId}
                                    >
                                        {audioInput.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center justify-evenly">
                            <p>Audio Output</p>
                            <select
                                name="audioOutput"
                                id="audioOutput"
                                value={selectedAudioOutput}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                    setSelectedAudioOutput(e.target.value)
                                }
                                className="border p-2 rounded"
                            >
                                {audioOutputDevices.map((audioOutput) => (
                                    <option
                                        value={audioOutput.deviceId}
                                        key={audioOutput.deviceId}
                                    >
                                        {audioOutput.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Room;
