"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import BulkPriceReviewModal from "./BulkPriceReviewModal";
import ImageCropModal from "./ImageCropModal";

type Props = {
    ingredients: { id: number; name: string }[];
};

export default function GlobalCameraFab({ ingredients }: Props) {
    const [isThinking, setIsThinking] = useState(false);
    const [ocrItems, setOcrItems] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
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

            if (!res.ok) throw new Error("OCR Failed");

            const data = await res.json();
            setOcrItems(data.items);
            setIsModalOpen(true);
        } catch (error) {
            console.error(error);
            alert("영수증 인식에 실패했습니다.");
        } finally {
            setIsThinking(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <>
            {/* Hidden Input */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            {/* FAB Button */}
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isThinking}
                className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                aria-label="영수증/장부 촬영"
            >
                {isThinking ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                    <Camera className="h-8 w-8" />
                )}
            </button>

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
            />
        </>
    );
}
