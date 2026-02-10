"use client";

import { X, Share2, TrendingDown, TrendingUp, HelpCircle } from "lucide-react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    report: string[];
    date: string;
};

export default function PriceAnalysisModal({ isOpen, onClose, report, date }: Props) {
    if (!isOpen) return null;

    const handleShare = () => {
        const text = `[식자재 비서 AI 분석 리포트 - ${date}]\n\n${report.join("\n")}`;
        if (navigator.share) {
            navigator.share({
                title: '식자재 분석 리포트',
                text: text,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text);
            alert("리포트 내용이 복사되었습니다.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">AI 분석 리포트</h2>
                            <p className="text-xs text-purple-100">{date} 구매 내역 기준</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-gray-50/30">
                    <div className="space-y-3">
                        {report.map((line, idx) => {
                            const isSummary = line.startsWith("🔵") || line.startsWith("🔴") || line.startsWith("⚪") || line.startsWith("💰") || line.startsWith("💡") || line.startsWith("✅") || line.startsWith("❓");
                            const isDetail = line.startsWith("💎") || line.startsWith("🔵") || line.startsWith("🔴") || line.startsWith("✨") || line.startsWith("🎉") || line.startsWith("📉");

                            return (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-2xl border transition-all ${isSummary
                                        ? line.includes("🔴") ? "bg-red-50 border-red-100 shadow-sm"
                                            : line.includes("🔵") ? "bg-blue-50 border-blue-100 shadow-sm"
                                                : "bg-white border-purple-100 shadow-sm"
                                        : isDetail
                                            ? line.includes("🔴") ? "bg-red-50/30 border-red-50"
                                                : line.includes("💎") ? "bg-blue-50/30 border-blue-50"
                                                    : "bg-purple-50/30 border-purple-50"
                                            : "bg-transparent border-transparent text-gray-500 text-xs text-center pb-2"
                                        }`}
                                >
                                    <p className={`${isSummary ? "font-black text-gray-900 text-base" : "text-sm text-gray-700 leading-relaxed font-bold"}`}>
                                        {line}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-3 bg-white">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-2xl py-4 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all"
                    >
                        닫기
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 rounded-2xl bg-purple-600 py-4 text-sm font-black text-white hover:bg-purple-700 shadow-xl shadow-purple-100 transition-all flex items-center justify-center gap-2"
                    >
                        <Share2 className="h-4 w-4" /> 리포트 공유하기
                    </button>
                </div>
            </div>
        </div>
    );
}
