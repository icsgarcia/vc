import type { RefObject } from "react";

// type = audioinput, audiooutput, or videoinput
export const getConnectedDevices = async (type: string) => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === type);
};

export const startCamera = async (
    videoRef: RefObject<HTMLVideoElement | null>,
    videoInput: string | undefined,
    audioInput: string | undefined
) => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: audioInput
                ? {
                      deviceId: { exact: audioInput },
                      noiseSuppression: true,
                      echoCancellation: true,
                  }
                : true,
            video: videoInput
                ? {
                      deviceId: { exact: videoInput },
                  }
                : true,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        return stream;
    } catch (error) {
        console.error("Error accessing media devices.", error);
    }
};
