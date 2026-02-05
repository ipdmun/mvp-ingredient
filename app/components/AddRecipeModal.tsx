"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { createRecipe } from "@/app/recipes/actions";
import { useRouter } from "next/navigation";

interface AddRecipeModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddRecipeModal({ onClose, onSuccess }: AddRecipeModalProps) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const result = await createRecipe({ name });
            if (result.success) {
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.refresh();
                    onClose();
                }
            } else {
                alert(result.error || "레시피 추가 오류");
            }
        } catch (error: any) {
            console.error(error);
            alert("레시피 추가 오류: " + (error.message || JSON.stringify(error)));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-gray-900">새 메뉴 추가</h2>
                        <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">메뉴 이름</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="예: 김치찌개"
                                className="w-full h-14 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none font-bold text-lg transition-all placeholder:font-normal placeholder:text-gray-400"
                                autoFocus
                            />
                            <p className="text-xs text-gray-400 ml-1">
                                * 메뉴 이름에 제육, 된장 등이 포함되면<br />
                                <span className="text-orange-500 font-bold">추천 레시피</span>가 자동으로 등록됩니다!
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={!name.trim() || isLoading}
                            className="w-full h-14 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-black active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "만들기"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
