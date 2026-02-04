"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getPerspectiveCroppedImg } from "@/app/lib/perspectiveUtils";
import { X, Check, Loader2 } from "lucide-react";

type Point = { x: number; y: number };

type Props = {
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
};

export default function ImageCropModal({ image, onCropComplete, onCancel }: Props) {
    const [points, setPoints] = useState<Point[]>([
        { x: 10, y: 10 }, // 0: TL
        { x: 90, y: 10 }, // 1: TR
        { x: 90, y: 90 }, // 2: BR
        { x: 10, y: 90 }, // 3: BL
    ]);
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const [draggingEdge, setDraggingEdge] = useState<number[] | null>(null);
    const [startPos, setStartPos] = useState<Point | null>(null);
    const [startPoints, setStartPoints] = useState<Point[] | null>(null);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget.getBoundingClientRect();
        setImgSize({ w: width, h: height });
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point => {
        const rect = imgRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        return {
            x: ((clientX - rect.left) / rect.width) * 100,
            y: ((clientY - rect.top) / rect.height) * 100
        };
    };

    const handleMouseDown = (idx: number, e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setDraggingIdx(idx);
    };

    const handleEdgeMouseDown = (idx1: number, idx2: number, e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setDraggingEdge([idx1, idx2]);
        setStartPos(getPos(e));
        setStartPoints([...points]);
    };

    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!imgRef.current) return;

        if (draggingIdx !== null) {
            const pos = getPos(e);
            setPoints(prev => {
                const next = [...prev];
                next[draggingIdx] = {
                    x: Math.max(0, Math.min(100, pos.x)),
                    y: Math.max(0, Math.min(100, pos.y))
                };
                return next;
            });
        } else if (draggingEdge !== null && startPos && startPoints) {
            const pos = getPos(e);
            const dx = pos.x - startPos.x;
            const dy = pos.y - startPos.y;

            setPoints(prev => {
                const next = [...prev];
                draggingEdge.forEach(idx => {
                    next[idx] = {
                        x: Math.max(0, Math.min(100, startPoints[idx].x + dx)),
                        y: Math.max(0, Math.min(100, startPoints[idx].y + dy))
                    };
                });
                return next;
            });
        }
    }, [draggingIdx, draggingEdge, startPos, startPoints]);

    const handleMouseUp = useCallback(() => {
        setDraggingIdx(null);
        setDraggingEdge(null);
        setStartPos(null);
        setStartPoints(null);
    }, []);

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("touchmove", handleMouseMove);
        window.addEventListener("touchend", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleMouseMove);
            window.removeEventListener("touchend", handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const handleConfirm = async () => {
        if (!imgRef.current || isProcessing) return;

        setIsProcessing(true);
        const { naturalWidth, naturalHeight } = imgRef.current;
        const naturalPoints = points.map(p => ({
            x: (p.x / 100) * naturalWidth,
            y: (p.y / 100) * naturalHeight
        }));

        // tl, tr, br, bl
        const topWidth = Math.sqrt(Math.pow(naturalPoints[1].x - naturalPoints[0].x, 2) + Math.pow(naturalPoints[1].y - naturalPoints[0].y, 2));
        const bottomWidth = Math.sqrt(Math.pow(naturalPoints[2].x - naturalPoints[3].x, 2) + Math.pow(naturalPoints[2].y - naturalPoints[3].y, 2));
        const leftHeight = Math.sqrt(Math.pow(naturalPoints[3].x - naturalPoints[0].x, 2) + Math.pow(naturalPoints[3].y - naturalPoints[0].y, 2));
        const rightHeight = Math.sqrt(Math.pow(naturalPoints[2].x - naturalPoints[1].x, 2) + Math.pow(naturalPoints[2].y - naturalPoints[1].y, 2));

        const destWidth = Math.max(topWidth, bottomWidth);
        const destHeight = Math.max(leftHeight, rightHeight);

        try {
            const blob = await getPerspectiveCroppedImg(image, naturalPoints, destWidth, destHeight);
            if (blob) onCropComplete(blob);
        } catch (e) {
            console.error(e);
            alert("이미지 처리 중 오류가 발생했습니다.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 p-2 sm:p-4 select-none">
            <div className="relative flex-1 w-full max-w-2xl overflow-hidden rounded-2xl bg-gray-900 flex items-center justify-center">
                <div className="relative inline-block">
                    <img
                        ref={imgRef}
                        src={image}
                        alt="Target"
                        onLoad={handleImageLoad}
                        className="max-h-[70vh] w-auto object-contain block pointer-events-none"
                    />

                    {imgSize.w > 0 && (
                        <svg
                            className="absolute top-0 left-0 w-full h-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                        >
                            {/* Polygon overlay */}
                            <polygon
                                points={points.map(p => `${p.x},${p.y}`).join(' ')}
                                className="fill-blue-500/20 stroke-blue-500 stroke-[0.5]"
                            />

                            {/* Edge Hit Areas (Invisible but draggable) */}
                            {[[0, 1], [1, 2], [2, 3], [3, 0]].map(([i, j]) => (
                                <line
                                    key={`edge-${i}-${j}`}
                                    x1={points[i].x} y1={points[i].y}
                                    x2={points[j].x} y2={points[j].y}
                                    className="stroke-transparent stroke-[6] cursor-move"
                                    onMouseDown={(e) => handleEdgeMouseDown(i, j, e)}
                                    onTouchStart={(e) => handleEdgeMouseDown(i, j, e)}
                                />
                            ))}

                            {/* Drag Handles (Corners) */}
                            {points.map((p, i) => (
                                <circle
                                    key={`point-${i}`}
                                    cx={p.x}
                                    cy={p.y}
                                    r="3"
                                    className="fill-white stroke-blue-600 stroke-[1] cursor-move hover:scale-150 transition-transform"
                                    onMouseDown={(e) => handleMouseDown(i, e)}
                                    onTouchStart={(e) => handleMouseDown(i, e)}
                                />
                            ))}
                        </svg>
                    )}
                </div>
            </div>

            <div className="mt-4 sm:mt-6 flex w-full max-w-2xl items-center justify-between gap-4 px-4 pb-4">
                <button
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-700 py-3 sm:py-4 text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                    <X className="h-5 w-5" /> 취소
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 sm:py-4 font-bold text-white hover:bg-blue-500 transition-colors shadow-lg disabled:opacity-50"
                >
                    {isProcessing ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> 처리 중...</>
                    ) : (
                        <><Check className="h-5 w-5" /> 구역 선택 완료</>
                    )}
                </button>
            </div>

            <div className="text-center px-4 mb-4">
                <p className="text-xs sm:text-sm text-gray-400">
                    모서리나 선을 드래그하여 인식할 영역을 맞추세요. <br />
                    삐딱한 글씨도 반듯하게 펴서 정확히 인식합니다.
                </p>
            </div>
        </div>
    );
}
