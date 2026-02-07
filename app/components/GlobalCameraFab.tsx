"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import BulkPriceReviewModal from "./BulkPriceReviewModal";
import ImageCropModal from "./ImageCropModal";
import CustomCameraModal from "./CustomCameraModal";

type Props = {
    ingredients: { id: number; name: string }[];
};

export default function GlobalCameraFab({ ingredients }: Props) {
    const [isThinking, setIsThinking] = useState(false);
    const [ocrItems, setOcrItems] = useState<any[]>([]);
    const [analystReport, setAnalystReport] = useState<any[]>([]); // New state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setImageToCrop(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleCapture = (dataUrl: string) => {
        setImageToCrop(dataUrl);
        setIsCameraOpen(false);
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setImageToCrop(null);
        setIsThinking(true);
        try {
            const formData = new FormData();
            formData.append("file", croppedBlob, "cropped_image.jpg");

            const res = await fetch("/api/ocr", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "OCR Failed");
            }

            const data = await res.json();
            setOcrItems(data.items);
            setAnalystReport(data.analystReport || []); // Capture report
            setIsModalOpen(true);
        } catch (error: any) {
            console.error(error);
            alert(error.message || "영수증 인식에 실패했습니다.");
        } finally {
            setIsThinking(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <>
            {/* Hidden Input for Desktop Fallback */}
            <input
                type="file"
                accept="image/*"
                capture={"environment" as any}
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            {/* FAB Button Container */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
                {/* File Upload Small Button (Floating) */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                    aria-label="파일 업로드"
                    title="앨범에서 선택"
                >
                    <Upload className="h-5 w-5" />
                </button>

                {/* Main Camera FAB */}
                <button
                    onClick={() => setIsCameraOpen(true)}
                    disabled={isThinking}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    aria-label="영수증/장부 촬영"
                >
                    {isThinking ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                        <Camera className="h-8 w-8" />
                    )}
                </button>
            </div>

            {/* Custom Camera Modal */}
            {isCameraOpen && (
                <CustomCameraModal
                    onCapture={handleCapture}
                    onClose={() => setIsCameraOpen(false)}
                />
            )}

            {/* Crop Modal */}
            {imageToCrop && (
                <ImageCropModal
                    image={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setImageToCrop(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                />
            )}

            {/* Bulk Review Modal */}
            <BulkPriceReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                items={ocrItems}
                ingredients={ingredients}
                analystReport={analystReport}
            />
        </>
    );
}
