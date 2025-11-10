import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { socket } from "../socket";
import Events from "../components/Events";
import MyForm from "../components/MyForm";
import { getConnectedDevices, startCamera } from "../webrtc";
import { useLocation, useParams } from "react-router";

export interface Messages {
    username: string;
    message: string;
    date: string;
}

const Room = () => {
    const location = useLocation();
    const params = useParams();
    const roomId = params.id;
    const username = location.state?.username;
    const [isInitiator, setIsInitiator] = useState<boolean>(false);
    const [messages, setMessages] = useState<Messages[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false); // Camera off by default
    const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(false);
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
    const [error, setError] = useState<string>("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionState, setConnectionState] = useState<string>("new");
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    // ICE server configuration with TURN support
    const config = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            // Add TURN server if configured
            ...(import.meta.env.VITE_TURN_SERVER_URL
                ? [
                      {
                          urls: import.meta.env.VITE_TURN_SERVER_URL,
                          username: import.meta.env.VITE_TURN_USERNAME,
                          credential: import.meta.env.VITE_TURN_CREDENTIAL,
                      },
                  ]
                : []),
        ],
        iceCandidatePoolSize: 10,
    };

    // connect and join the room with error handling
    useEffect(() => {
        setIsConnecting(true);

        socket.connect();

        socket.on("connect", () => {
            console.log("Socket connected successfully");
            setIsConnecting(false);
            setError("");
            socket.emit("join-room", username, roomId);
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            setIsConnecting(false);
            setError(
                "Failed to connect to server. Please check your internet connection."
            );
        });

        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
            if (reason === "io server disconnect") {
                // Server disconnected, try to reconnect
                socket.connect();
            }
        });

        return () => {
            socket.off("connect");
            socket.off("connect_error");
            socket.off("disconnect");
            socket.disconnect();
        };
    }, [roomId, username]);

    // Initialize peer connection and handle WebRTC signaling
    useEffect(() => {
        const peerConnection = new RTCPeerConnection(config);
        peerConnectionRef.current = peerConnection;

        const makeCall = async () => {
            try {
                if (!peerConnection) {
                    console.error("Peer connection not initialized");
                    return;
                }

                console.log("Creating offer");
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                socket.emit("offer", offer);
                console.log("Sent offer");
            } catch (error) {
                console.error("Error making call:", error);
            }
        };

        // Handle incoming remote tracks
        peerConnection.ontrack = (event) => {
            console.log("Remote track received:", event.streams[0]);
            const remoteStream = event.streams[0];

            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }

            // Monitor the stream for track changes
            const updateRemoteState = () => {
                if (remoteStream) {
                    const videoTracks = remoteStream.getVideoTracks();
                    const hasActiveVideo = videoTracks.some(
                        (track) => track.readyState === "live" && track.enabled
                    );
                    setIsRemoteCameraOn(hasActiveVideo);

                    if (!hasActiveVideo && remoteVideoRef.current) {
                        console.log(
                            "No active video tracks, clearing remote video"
                        );
                        remoteVideoRef.current.srcObject = null;
                    }
                }
            };

            // Check immediately
            updateRemoteState();

            // Listen for track ended event
            event.track.onended = () => {
                console.log("Remote track ended");
                updateRemoteState();
            };

            // Listen for track removal
            remoteStream.onremovetrack = () => {
                console.log("Track removed from remote stream");
                updateRemoteState();
            };

            // Listen for track addition
            remoteStream.onaddtrack = () => {
                console.log("Track added to remote stream");
                updateRemoteState();
            };
        };

        // Detect when remote peer removes all tracks
        peerConnection.onnegotiationneeded = () => {
            console.log("Negotiation needed");

            // Check if remote stream has no active tracks
            if (remoteVideoRef.current?.srcObject) {
                const stream = remoteVideoRef.current.srcObject as MediaStream;
                const activeTracks = stream
                    .getTracks()
                    .filter((track) => track.readyState === "live");

                if (activeTracks.length === 0) {
                    console.log("No active remote tracks");
                    setIsRemoteCameraOn(false);
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = null;
                    }
                }
            }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate");
                socket.emit("ice-candidate", event.candidate);
            }
        };

        // Monitor connection state
        peerConnection.onconnectionstatechange = () => {
            console.log("Connection state:", peerConnection.connectionState);
            setConnectionState(peerConnection.connectionState);

            // Handle connection states
            if (peerConnection.connectionState === "connected") {
                setError("");
                console.log("Peer connection established successfully");
            } else if (peerConnection.connectionState === "failed") {
                setError(
                    "Connection failed. Please check your network or try refreshing."
                );
            } else if (peerConnection.connectionState === "disconnected") {
                setError("Connection lost. Attempting to reconnect...");
            }

            // If disconnected, clear remote video
            if (
                peerConnection.connectionState === "disconnected" ||
                peerConnection.connectionState === "failed" ||
                peerConnection.connectionState === "closed"
            ) {
                setIsRemoteCameraOn(false);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = null;
                }
            }
        };

        // Handle incoming offer
        socket.on("offer", async (offer) => {
            console.log("Received offer");
            try {
                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(offer)
                );
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit("answer", answer);
                console.log("Sent answer");
            } catch (error) {
                console.error("Error handling offer:", error);
            }
        });

        // Handle incoming answer
        socket.on("answer", async (answer) => {
            console.log("Received answer");
            try {
                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(answer)
                );
            } catch (error) {
                console.error("Error handling answer:", error);
            }
        });

        // Handle incoming ICE candidates
        socket.on("ice-candidate", async (candidate) => {
            console.log("Received ICE candidate");
            try {
                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );
            } catch (error) {
                console.error("Error adding ICE candidate:", error);
            }
        });

        // Handle user joined event
        socket.on("user-joined", ({ isFirst }) => {
            console.log("User joined event received, isFirst:", isFirst);
            if (isFirst) {
                // You are the first user, wait for others to join
                setIsInitiator(true);
                console.log("You are the first user in the room");
            } else {
                // Someone else is already in the room, initiate call
                setIsInitiator(false);
                console.log("Someone is already in the room, initiating call");
                setTimeout(() => makeCall(), 2000); // Increased delay for stream setup
            }
        });

        // Handle when you should start the call (sent by existing user)
        socket.on("ready-to-call", () => {
            console.log("Ready to call - initiating offer");
            setTimeout(() => makeCall(), 2000); // Increased delay for stream setup
        });

        return () => {
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("user-joined");
            socket.off("ready-to-call");
            peerConnection.close();
            peerConnectionRef.current = null;
        };
    }, []);

    // Add local stream tracks to peer connection
    useEffect(() => {
        const addTracksAndRenegotiate = async () => {
            if (stream && peerConnectionRef.current) {
                const peerConnection = peerConnectionRef.current;

                // Remove existing tracks
                peerConnection.getSenders().forEach((sender) => {
                    peerConnection.removeTrack(sender);
                });

                // Add new tracks
                stream.getTracks().forEach((track) => {
                    console.log("Adding local track:", track.kind, track.label);
                    peerConnection.addTrack(track, stream);
                });

                // Renegotiate if already connected or connecting
                if (
                    peerConnection.connectionState === "connected" ||
                    peerConnection.connectionState === "connecting"
                ) {
                    console.log("Renegotiating due to stream change");
                    try {
                        const offer = await peerConnection.createOffer();
                        await peerConnection.setLocalDescription(offer);
                        socket.emit("offer", offer);
                    } catch (error) {
                        console.error("Error renegotiating:", error);
                    }
                }
            } else if (!stream && peerConnectionRef.current) {
                // If stream is removed (camera off), remove all tracks and renegotiate
                const peerConnection = peerConnectionRef.current;
                const hadTracks = peerConnection.getSenders().length > 0;

                peerConnection.getSenders().forEach((sender) => {
                    peerConnection.removeTrack(sender);
                });

                if (
                    hadTracks &&
                    peerConnection.connectionState === "connected"
                ) {
                    console.log("Renegotiating after removing tracks");
                    try {
                        const offer = await peerConnection.createOffer();
                        await peerConnection.setLocalDescription(offer);
                        socket.emit("offer", offer);
                    } catch (error) {
                        console.error("Error renegotiating:", error);
                    }
                }
            }
        };

        addTracksAndRenegotiate();
    }, [stream]);

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
            const videoDevices = await getConnectedDevices("videoinput");
            const audioInDevices = await getConnectedDevices("audioinput");
            const audioOutDevices = await getConnectedDevices("audiooutput");

            setVideoInputDevices(videoDevices);
            setAudioInputDevices(audioInDevices);
            setAudioOutputDevices(audioOutDevices);

            // Set default devices
            if (videoDevices.length > 0 && !selectedVideoInput) {
                setSelectedVideoInput(videoDevices[0].deviceId);
            }
            if (audioInDevices.length > 0 && !selectedAudioInput) {
                setSelectedAudioInput(audioInDevices[0].deviceId);
            }
            if (audioOutDevices.length > 0 && !selectedAudioOutput) {
                setSelectedAudioOutput(audioOutDevices[0].deviceId);
            }
        };
        getDevices();
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

    // Auto-start audio only (for call connection) when devices are ready
    useEffect(() => {
        const autoStartAudio = async () => {
            try {
                if (!stream && selectedAudioInput && !isCameraOn) {
                    console.log("Auto-starting audio-only for call connection");
                    // Get audio-only stream for initial connection
                    const audioStream =
                        await navigator.mediaDevices.getUserMedia({
                            audio: selectedAudioInput
                                ? { deviceId: selectedAudioInput }
                                : true,
                            video: false,
                        });

                    if (audioStream && videoRef.current) {
                        videoRef.current.srcObject = audioStream;
                        setStream(audioStream);
                        console.log("Audio stream started successfully");
                        setError("");
                    }
                }
            } catch (error) {
                console.error("Error auto-starting audio:", error);
                const err = error as Error;
                if (err.name === "NotAllowedError") {
                    setError(
                        "Microphone access denied. Please allow microphone access to join the call."
                    );
                } else if (err.name === "NotFoundError") {
                    setError(
                        "No microphone found. Please connect a microphone."
                    );
                } else {
                    setError(
                        "Failed to access microphone. Please check your device settings."
                    );
                }
            }
        };
        autoStartAudio();
    }, [selectedAudioInput, isCameraOn, stream]);

    // Handle manual device changes from settings
    useEffect(() => {
        const updateStreamOnDeviceChange = async () => {
            try {
                // Only update if we have an existing stream
                if (stream && (selectedVideoInput || selectedAudioInput)) {
                    console.log("Updating stream due to device change");
                    stream.getTracks().forEach((track) => track.stop());

                    let newStream;
                    if (isCameraOn) {
                        // Update with video and audio
                        newStream = await startCamera(
                            videoRef,
                            selectedVideoInput,
                            selectedAudioInput
                        );
                    } else {
                        // Update audio only
                        newStream = await navigator.mediaDevices.getUserMedia({
                            audio: selectedAudioInput
                                ? { deviceId: selectedAudioInput }
                                : true,
                            video: false,
                        });
                        if (videoRef.current) {
                            videoRef.current.srcObject = newStream;
                        }
                    }

                    if (newStream) {
                        setStream(newStream);
                    } else {
                        console.error(
                            "Failed to get stream after device change"
                        );
                    }
                }
            } catch (error) {
                console.error("Error updating media stream:", error);
            }
        };

        // Add a small delay to prevent duplicate calls
        const timeoutId = setTimeout(updateStreamOnDeviceChange, 100);
        return () => clearTimeout(timeoutId);
    }, [selectedVideoInput, selectedAudioInput]);

    const makeCall = async () => {
        try {
            const peerConnection = peerConnectionRef.current;
            if (!peerConnection) {
                console.error("Peer connection not initialized");
                return;
            }

            console.log("Creating offer");
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit("offer", offer);
            console.log("Sent offer");
        } catch (error) {
            console.error("Error making call:", error);
        }
    };

    const toggleCamera = async () => {
        try {
            if (isCameraOn) {
                // Turn off camera but keep audio
                if (stream) {
                    const videoTracks = stream.getVideoTracks();
                    videoTracks.forEach((track) => track.stop());

                    // Keep only audio tracks
                    const audioTracks = stream.getAudioTracks();
                    if (audioTracks.length > 0) {
                        const audioStream = new MediaStream(audioTracks);
                        setStream(audioStream);
                    } else {
                        // If no audio, get audio-only stream
                        const audioStream =
                            await navigator.mediaDevices.getUserMedia({
                                audio: selectedAudioInput
                                    ? { deviceId: selectedAudioInput }
                                    : true,
                                video: false,
                            });
                        if (videoRef.current) {
                            videoRef.current.srcObject = audioStream;
                        }
                        setStream(audioStream);
                    }
                }
                // Clear the video element display
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
                setIsCameraOn(false);
            } else {
                // Turn on camera (add video to existing audio)
                const newStream = await startCamera(
                    videoRef,
                    selectedVideoInput,
                    selectedAudioInput
                );
                if (newStream) {
                    setStream(newStream);
                    setIsCameraOn(true);
                } else {
                    console.error("Failed to start camera");
                }
            }
        } catch (error) {
            console.error("Error toggling camera:", error);
        }
    };

    const toggleMute = () => {
        if (stream) {
            stream
                .getAudioTracks()
                .forEach((track) => (track.enabled = !track.enabled));
            setIsMuted(!isMuted);
        }
    };

    return (
        <main className="relative min-h-screen w-full flex flex-col lg:flex-row p-2 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 gap-2 sm:gap-4 lg:gap-6">
            {/* Error Banner */}
            {error && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4">
                    <div className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-2xl flex items-start gap-3">
                        <svg
                            className="w-6 h-6 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        <div className="flex-1">
                            <p className="font-medium text-sm">{error}</p>
                        </div>
                        <button
                            onClick={() => setError("")}
                            className="text-white hover:text-gray-200"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Connecting Overlay */}
            {isConnecting && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
                    <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700">
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-500"></div>
                            <p className="text-white font-medium">
                                Connecting to server...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Section */}
            <div className="flex-1 bg-gray-800/50 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-2xl flex flex-col p-3 sm:p-4 lg:p-6 border border-gray-700/50">
                {/* Header */}
                <div className="mb-3 sm:mb-4">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
                        Room {roomId}
                    </h1>
                    <div className="flex items-center gap-2">
                        <p className="text-gray-400 text-xs sm:text-sm">
                            {isInitiator
                                ? "Waiting for participant to join..."
                                : "Connected"}
                        </p>
                        {/* Connection Status Indicator */}
                        <div className="flex items-center gap-1.5">
                            <div
                                className={`w-2 h-2 rounded-full ${
                                    connectionState === "connected"
                                        ? "bg-green-500"
                                        : connectionState === "connecting"
                                        ? "bg-yellow-500 animate-pulse"
                                        : connectionState === "failed"
                                        ? "bg-red-500"
                                        : "bg-gray-500"
                                }`}
                            ></div>
                            <span className="text-xs text-gray-500 capitalize">
                                {connectionState}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Video Grid */}
                <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-4 lg:mb-6">
                    {/* Local Video */}
                    <div className="relative group w-full md:w-auto">
                        <div className="absolute -top-6 sm:-top-8 left-0 z-10">
                            <span className="text-white font-medium text-xs sm:text-sm bg-gray-900/80 px-2 sm:px-3 py-1 rounded-full">
                                {username} (You)
                            </span>
                        </div>
                        <div className="relative w-full md:w-[400px] lg:w-[500px] h-[250px] sm:h-[300px] lg:h-[375px] bg-gray-900 rounded-lg lg:rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 group-hover:border-blue-500 transition-all duration-300">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`-scale-x-100 w-full h-full object-cover ${
                                    !isCameraOn ? "hidden" : ""
                                }`}
                            ></video>
                            {!isCameraOn && (
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center">
                                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                        <svg
                                            className="w-12 h-12 text-gray-500"
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
                                    <p className="text-gray-400 font-medium">
                                        Camera Off
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Remote Video */}
                    <div className="relative group w-full md:w-auto">
                        <div className="absolute -top-6 sm:-top-8 left-0 z-10">
                            <span className="text-white font-medium text-xs sm:text-sm bg-gray-900/80 px-2 sm:px-3 py-1 rounded-full">
                                Remote User
                            </span>
                        </div>
                        <div className="relative w-full md:w-[400px] lg:w-[500px] h-[250px] sm:h-[300px] lg:h-[375px] bg-gray-900 rounded-lg lg:rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 group-hover:border-green-500 transition-all duration-300">
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className={`-scale-x-100 w-full h-full object-cover ${
                                    !isRemoteCameraOn ? "hidden" : ""
                                }`}
                            ></video>
                            {!isRemoteCameraOn && (
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center">
                                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                        <svg
                                            className="w-12 h-12 text-gray-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400 font-medium">
                                        No Video
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-4">
                    <button
                        onClick={toggleMute}
                        className={`group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-full text-sm sm:text-base font-medium transition-all duration-300 shadow-lg ${
                            isMuted
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-gray-700 hover:bg-gray-600 text-white"
                        }`}
                    >
                        <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 inline sm:mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {isMuted ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                />
                            )}
                        </svg>
                        <span className="hidden sm:inline">
                            {isMuted ? "Unmute" : "Mute"}
                        </span>
                    </button>

                    <button
                        onClick={toggleCamera}
                        className={`group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-full text-sm sm:text-base font-medium transition-all duration-300 shadow-lg ${
                            isCameraOn
                                ? "bg-blue-500 hover:bg-blue-600 text-white"
                                : "bg-gray-700 hover:bg-gray-600 text-white"
                        }`}
                    >
                        <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 inline sm:mr-2"
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
                        <span className="hidden sm:inline">
                            {isCameraOn ? "Stop Video" : "Start Video"}
                        </span>
                    </button>

                    <button
                        onClick={() => setOpenSettings(true)}
                        className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-sm sm:text-base font-medium transition-all duration-300 shadow-lg"
                    >
                        <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 inline sm:mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        <span className="hidden sm:inline">Settings</span>
                    </button>
                </div>
            </div>

            {/* Chat Section */}
            <div className="w-full lg:w-[380px] bg-gray-800/50 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-2xl flex flex-col border border-gray-700/50 max-h-[400px] lg:max-h-none">
                {/* Chat Header */}
                <div className="p-3 sm:p-4 border-b border-gray-700">
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                        <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400"
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
                        Messages
                    </h2>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                    <Events events={messages} />
                </div>

                {/* Message Input */}
                <div className="p-3 sm:p-4 border-t border-gray-700">
                    <MyForm />
                </div>
            </div>

            {/* Settings Modal */}
            {openSettings && (
                <div
                    onClick={() => setOpenSettings(false)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden"
                    >
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-white flex items-center">
                                    <svg
                                        className="w-7 h-7 mr-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    Device Settings
                                </h2>
                                <button
                                    onClick={() => setOpenSettings(false)}
                                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Video Input */}
                            <div>
                                <label className="flex items-center text-white font-semibold mb-3">
                                    <svg
                                        className="w-5 h-5 mr-2 text-blue-400"
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
                                    Video Input
                                </label>
                                <select
                                    name="videoInput"
                                    id="videoInput"
                                    value={selectedVideoInput || ""}
                                    onChange={(
                                        e: ChangeEvent<HTMLSelectElement>
                                    ) => setSelectedVideoInput(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                >
                                    {videoInputDevices.map((videoInput) => (
                                        <option
                                            value={videoInput.deviceId}
                                            key={videoInput.deviceId}
                                        >
                                            {videoInput.label ||
                                                `Camera ${videoInput.deviceId.slice(
                                                    0,
                                                    5
                                                )}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Audio Input */}
                            <div>
                                <label className="flex items-center text-white font-semibold mb-3">
                                    <svg
                                        className="w-5 h-5 mr-2 text-green-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                        />
                                    </svg>
                                    Microphone
                                </label>
                                <select
                                    name="audioInput"
                                    id="audioInput"
                                    value={selectedAudioInput || ""}
                                    onChange={(
                                        e: ChangeEvent<HTMLSelectElement>
                                    ) => setSelectedAudioInput(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                >
                                    {audioInputDevices.map((audioInput) => (
                                        <option
                                            value={audioInput.deviceId}
                                            key={audioInput.deviceId}
                                        >
                                            {audioInput.label ||
                                                `Microphone ${audioInput.deviceId.slice(
                                                    0,
                                                    5
                                                )}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Audio Output */}
                            <div>
                                <label className="flex items-center text-white font-semibold mb-3">
                                    <svg
                                        className="w-5 h-5 mr-2 text-purple-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                        />
                                    </svg>
                                    Speaker
                                </label>
                                <select
                                    name="audioOutput"
                                    id="audioOutput"
                                    value={selectedAudioOutput || ""}
                                    onChange={(
                                        e: ChangeEvent<HTMLSelectElement>
                                    ) => setSelectedAudioOutput(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                >
                                    {audioOutputDevices.map((audioOutput) => (
                                        <option
                                            value={audioOutput.deviceId}
                                            key={audioOutput.deviceId}
                                        >
                                            {audioOutput.label ||
                                                `Speaker ${audioOutput.deviceId.slice(
                                                    0,
                                                    5
                                                )}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-700/50 p-4 flex justify-end">
                            <button
                                onClick={() => setOpenSettings(false)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Room;
