"use client";

import { useState } from "react";
import AddRecipeModal from "../components/AddRecipeModal";
import { Plus } from "lucide-react";

export default function AddRecipeModalClient({ onAddSuccess, children }: { onAddSuccess?: () => void, children?: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSuccess = () => {
        setIsOpen(false);
        if (onAddSuccess) onAddSuccess();
    };

    return (
        <>
            {children ? (
                <div onClick={() => setIsOpen(true)}>
                    {children}
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex aspect-[1/1.2] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-400 transition-all hover:border-orange-200 hover:bg-orange-50/30 hover:text-orange-500 active:scale-95"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
                        <Plus className="h-6 w-6" />
                    </div>
                    <span className="font-bold">새 메뉴 등록</span>
                </button>
            )}

            {isOpen && <AddRecipeModal onClose={() => setIsOpen(false)} onSuccess={handleSuccess} />}
        </>
    );
}
