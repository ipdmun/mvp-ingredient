"use client";

import { useState, useRef, useEffect } from "react";
import { X, Camera, RefreshCw, Image } from "lucide-react";

type Props = {
    onCapture: (image: string) => void;
    onClose: () => void;
};

export default function CustomCameraModal({ onCapture, onClose }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreamReady, setIsStreamReady] = useState(false);
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [currentCameraIdx, setCurrentCameraIdx] = useState(0);

    // Initialize Camera
    useEffect(() => {
        let stream: MediaStream | null = null;

        async function startCamera() {
            try {
                // Get list of cameras
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === 'videoinput');
                setCameras(videoDevices);

                // Prefer environment (back) camera
                const backCameraIdx = videoDevices.findIndex(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
                const initialIdx = backCameraIdx !== -1 ? backCameraIdx : 0;
                setCurrentCameraIdx(initialIdx);

                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: videoDevices[initialIdx]?.deviceId,
                        facingMode: initialIdx === backCameraIdx ? "environment" : "user",
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsStreamReady(true);
                }
            } catch (err) {
                console.error("Camera access error:", err);
                alert("카메라를 시작할 수 없습니다. 권한을 확인해주세요.");
                onClose();
            }
        }

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const switchCamera = async () => {
        if (cameras.length < 2) return;

        setIsStreamReady(false);
        const nextIdx = (currentCameraIdx + 1) % cameras.length;
        setCurrentCameraIdx(nextIdx);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: cameras[nextIdx].deviceId,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsStreamReady(true);
        } catch (e) {
            console.error(e);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
            onCapture(dataUrl);
        }
    };

    const [focusPos, setFocusPos] = useState<{ x: number, y: number } | null>(null);

    const setFocus = async (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current) return;

        // Visual Focus Ring
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setFocusPos({ x, y });
        setTimeout(() => setFocusPos(null), 1000);

        // Actual Camera Focus (if supported)
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];

        if (track && 'getCapabilities' in track) {
            try {
                // @ts-ignore
                const capabilities = track.getCapabilities();
                // @ts-ignore
                if (capabilities.focusMode?.includes('manual')) {
                    await track.applyConstraints({
                        // @ts-ignore
                        advanced: [{ focusMode: 'manual', pointsOfInterest: [{ x: x / rect.width, y: y / rect.height }] }]
                    });
                }
            } catch (err) {
                console.warn("Focus not supported on this device/browser:", err);
            }
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                onCapture(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black">
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Header */}
            <div className="absolute top-0 flex w-full items-center justify-between p-4 z-10 bg-gradient-to-b from-black/50 to-transparent">
                <button onClick={onClose} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors">
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Viewfinder */}
            <div
                className="relative flex-1 overflow-hidden flex items-center justify-center cursor-crosshair"
                onClick={setFocus}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                />

                {/* Focus Ring */}
                {focusPos && (
                    <div
                        className="absolute h-16 w-16 border-2 border-yellow-400 rounded-full animate-ping pointer-events-none"
                        style={{ left: focusPos.x - 32, top: focusPos.y - 32 }}
                    />
                )}

                {!isStreamReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                        카메라 연결 중...
                    </div>
                )}
            </div>

            {/* Footer / Shutter */}
            <div className="flex h-32 w-full items-center justify-between bg-black px-10">
                {/* Gallery Button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-700 active:scale-95 transition-all"
                >
                    <Image className="h-6 w-6" />
                </button>

                {/* Shutter Button */}
                <button
                    onClick={capturePhoto}
                    disabled={!isStreamReady}
                    className="group relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white active:scale-90 transition-transform disabled:opacity-50"
                >
                    <div className="h-16 w-16 rounded-full bg-white group-active:bg-gray-200" />
                </button>

                {/* Placeholder for layout balance (or Switch Camera if enabled later) */}
                <div className="w-12" />
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
