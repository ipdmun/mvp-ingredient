"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScrollButtons() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
        });
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
                onClick={scrollToTop}
                className="bg-white/80 p-3 rounded-full shadow-lg border border-gray-100 backdrop-blur-sm text-gray-600 hover:text-blue-600 hover:bg-white transition-all active:scale-95"
                title="맨 위로"
            >
                <ArrowUp className="h-5 w-5" />
            </button>
            <button
                onClick={scrollToBottom}
                className="bg-white/80 p-3 rounded-full shadow-lg border border-gray-100 backdrop-blur-sm text-gray-600 hover:text-blue-600 hover:bg-white transition-all active:scale-95"
                title="맨 아래로"
            >
                <ArrowDown className="h-5 w-5" />
            </button>
        </div>
    );
}
