"use client";

import { Trash2 } from "lucide-react";
import { deleteRecipe } from "@/app/recipes/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";


interface DeleteRecipeButtonProps {
    recipeId: number;
    onDeleteSuccess?: () => void;
    variant?: 'default' | 'overlay';
}

export default function DeleteRecipeButton({ recipeId, onDeleteSuccess, variant = 'default' }: DeleteRecipeButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirm("정말로 이 레시피를 삭제하시겠습니까?")) {
            setIsDeleting(true);
            try {
                const result = await deleteRecipe(recipeId);
                if (result.success) {
                    if (onDeleteSuccess) {
                        onDeleteSuccess();
                    } else {
                        router.refresh();
                    }
                } else {
                    alert(result.error || "삭제에 실패했습니다.");
                }
            } catch (error: any) {
                console.error("Delete failed:", error);
                alert("삭제 처리 중 치명적 오류: " + (error.message || JSON.stringify(error)));
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const defaultStyle = "absolute top-2 right-2 z-20 h-9 w-9 flex items-center justify-center rounded-xl bg-red-500 text-white shadow-lg border-2 border-white transition-all hover:bg-red-600 active:scale-90 disabled:opacity-50";
    // Overlay style: Matches RecipeCard Camera button (bg-black/40, rounded-full, p-2)
    // Camera button classes: "bg-black/40 hover:bg-black/60 text-white rounded-full p-2"
    // We need to ensure it's positioned or handle positioning outside?
    // The previous component had absolute positioning BUILT IN. 
    // The user wants it to look like the camera button. 
    // Camera button is absolute top-3 left-3. Delete should be top-3 right-3.
    const overlayStyle = "absolute top-3 right-3 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-all active:scale-90 disabled:opacity-50 backdrop-blur-sm";

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={variant === 'overlay' ? overlayStyle : defaultStyle}
            title="레시피 삭제"
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
}
