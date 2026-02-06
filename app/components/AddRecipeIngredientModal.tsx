import { useState, useMemo } from "react";
import { X, Search, Loader2, Plus, ArrowLeft } from "lucide-react";
import { addRecipeIngredient, createAndAddRecipeIngredient } from "@/app/recipes/actions";
import { useRouter } from "next/navigation";

interface AddRecipeIngredientModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipeId: number;
    ingredients: any[];
    onSuccess?: () => void;
}

export default function AddRecipeIngredientModal({ isOpen, onClose, recipeId, ingredients, onSuccess }: AddRecipeIngredientModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
    const [amount, setAmount] = useState<string>("");

    // New Creation Mode
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newUnit, setNewUnit] = useState("g");
    const [purchasePrice, setPurchasePrice] = useState<string>("");
    const [purchaseAmount, setPurchaseAmount] = useState<string>("");

    const filteredIngredients = useMemo(() => {
        const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
        if (!searchTerm) return safeIngredients;

        return safeIngredients.filter((ing: any) =>
            ing && typeof ing.name === 'string' &&
            ing.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [ingredients, searchTerm]);

    async function handleSubmit() {
        // [UX Improvement] If user clicks submit with just a search term, switch to create mode
        if (!isCreating && !selectedIngredient && searchTerm) {
            setNewName(searchTerm);
            setIsCreating(true);
            return;
        }

        if (isCreating) {
            if (!newName || !newUnit || !amount) return;
        } else {
            if (!selectedIngredient || !amount) return;
        }

        setIsLoading(true);
        try {
            let result: any;
            if (isCreating) {
                // @ts-ignore
                result = await createAndAddRecipeIngredient(
                    Number(recipeId),
                    newName,
                    newUnit,
                    Number(amount),
                    Number(purchasePrice),
                    Number(purchaseAmount)
                );
            } else {
                // @ts-ignore
                result = await addRecipeIngredient(Number(recipeId), selectedIngredient.id, Number(amount));
            }

            if (result && result.success) {
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.refresh();
                    onClose();
                }
                // Reset
                setSelectedIngredient(null);
                setAmount("");
                setSearchTerm("");
                setIsCreating(false);
                setNewName("");
                setNewUnit("g");
                setPurchasePrice("");
                setPurchaseAmount("");
            } else {
                alert(result.error || "추가에 실패했습니다.");
            }
        } catch (error: any) {
            console.error(error);
            alert("처리 중 오류가 발생했습니다: " + error.message);
        } finally {
            setIsLoading(false);
        }
    }

    if (!isOpen) return null;

    // Helper to determine button text and disabled state
    const isButtonDisabled = () => {
        if (isLoading) return true;
        if (isCreating) return !newName || !newUnit || !amount;
        if (selectedIngredient) return !amount;
        return !searchTerm; // If no ingredient selected, allow if search term exists (to switch mode)
    };

    const getButtonText = () => {
        if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
        if (!isCreating && !selectedIngredient && searchTerm) return "재료 정보 입력하기";
        return "추가하기";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-gray-100 p-4">
                    <div className="flex items-center gap-2">
                        {isCreating && (
                            <button onClick={() => setIsCreating(false)} className="p-1 -ml-2 rounded-full hover:bg-gray-100 text-gray-500">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <h3 className="text-lg font-bold text-gray-900">
                            {isCreating ? "새로운 재료 만들기" : "레시피 재료 추가"}
                        </h3>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    {/* Mode 1: Creating New Ingredient */}
                    {isCreating ? (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">재료 이름</label>
                                <input
                                    autoFocus
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="예: 파프리카, 양파"
                                    className="mt-2 w-full rounded-xl border-2 border-orange-100 bg-orange-50/50 p-3 text-lg font-bold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-0"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">단위 (Unit)</label>
                                <div className="mt-2 flex gap-2 flex-wrap">
                                    {["g", "kg", "ml", "L", "개", "단", "봉", "캔", "병"].map((u) => (
                                        <button
                                            key={u}
                                            onClick={() => setNewUnit(u)}
                                            className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${newUnit === u
                                                ? "bg-gray-900 text-white border-gray-900 shadow-md transform scale-105"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                                }`}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                    <input
                                        value={newUnit}
                                        onChange={(e) => setNewUnit(e.target.value.toLowerCase())} // Enforce Lowercase
                                        placeholder="직접 입력"
                                        className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* New: Price & Purchase Amount Input */}
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">구매 용량</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="number"
                                            value={purchaseAmount}
                                            onChange={(e) => setPurchaseAmount(e.target.value.replace(/^0+(?=\d)/, ''))}
                                            placeholder="1000"
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base font-bold text-gray-900 focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="text-sm font-medium text-gray-500 whitespace-nowrap">{newUnit || "unit"}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">구매 가격</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="number"
                                            value={purchasePrice}
                                            onChange={(e) => setPurchasePrice(e.target.value.replace(/^0+(?=\d)/, ''))}
                                            placeholder="5000"
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base font-bold text-gray-900 focus:border-blue-500 focus:outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="text-sm font-medium text-gray-500 whitespace-nowrap">원</span>
                                    </div>
                                </div>
                                <div className="col-span-2 text-right">
                                    <p className="text-xs text-gray-400">
                                        단가: <span className="text-blue-600 font-bold">
                                            {purchasePrice && purchaseAmount ? Math.round(Number(purchasePrice) / Number(purchaseAmount)).toLocaleString() : 0}
                                        </span>
                                        원 / {newUnit}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-blue-600 uppercase tracking-wider ml-1">이 레시피에 넣을 양</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value.replace(/^0+(?=\d)/, ''))}
                                        placeholder="0"
                                        className="flex-1 rounded-xl border-2 border-blue-100 p-4 text-2xl font-bold focus:border-blue-500 focus:outline-none focus:ring-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="text-lg font-bold text-gray-600">{newUnit || "-"}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Mode 2: Selecting Existing Ingredient */
                        !selectedIngredient ? (
                            <>
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        placeholder="재료 검색 / 직접 추가..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-0"
                                    />
                                </div>

                                {/* "Create New" Prompt */}
                                {searchTerm && (
                                    <button
                                        onClick={() => {
                                            setNewName(searchTerm);
                                            setIsCreating(true);
                                        }}
                                        className="w-full mb-4 flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100 text-orange-700 hover:bg-orange-100 transition-colors group"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm text-orange-500 group-hover:scale-110 transition-transform">
                                            <Plus className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-sm">'{searchTerm}'(으)로 새로 만들기</p>
                                            <p className="text-xs opacity-70">목록에 없는 재료를 바로 추가하세요</p>
                                        </div>
                                    </button>
                                )}

                                <div className="space-y-2">
                                    {/* @ts-ignore */}
                                    {(filteredIngredients || []).map((ing, idx) => (
                                        ing ? (
                                            <button
                                                key={ing.id || idx}
                                                onClick={() => setSelectedIngredient(ing)}
                                                className="flex w-full items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50 hover:border-blue-200 transition-all text-left"
                                            >
                                                <span className="font-bold text-gray-900">{ing.name || "이름 없음"}</span>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{ing.unit || "-"}</span>
                                            </button>
                                        ) : null
                                    ))}
                                    {filteredIngredients.length === 0 && !searchTerm && (
                                        <p className="text-center text-sm text-gray-400 py-4">
                                            원하는 재료를 검색하거나,<br />없으면 바로 등록할 수 있어요.
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <span className="font-black text-blue-900 text-lg">{selectedIngredient.name}</span>
                                    <button onClick={() => setSelectedIngredient(null)} className="text-xs font-semibold text-blue-600 underline">변경</button>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">사용량 입력</label>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="number"
                                            autoFocus
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value.replace(/^0+(?=\d)/, ''))}
                                            placeholder="0"
                                            className="flex-1 rounded-xl border-2 border-blue-100 p-4 text-2xl font-bold focus:border-blue-500 focus:outline-none focus:ring-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="text-lg font-bold text-gray-600">{selectedIngredient.unit}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 ml-1 text-center">이 레시피 1회 생산 시 들어가는 양을 입력하세요</p>
                                </div>
                            </div>
                        )
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleSubmit}
                        disabled={isButtonDisabled()}
                        className="flex w-full items-center justify-center rounded-xl bg-blue-600 p-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:opacity-70"
                    >
                        {getButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
}
