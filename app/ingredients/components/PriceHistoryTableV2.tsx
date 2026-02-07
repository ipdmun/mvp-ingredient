import { convertPriceForDisplay } from "@/app/lib/utils";

// ... existing imports

type Props = {
    prices: PriceRecord[];
    lowestPriceId?: number;
    ingredientUnit: string;
};

export default function PriceHistoryTableV2({ prices, lowestPriceId, ingredientUnit }: Props) {
    // ... existing state and handlers

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {prices.length === 0 ? (
                // ... empty state
                <div className="p-8 text-center text-sm text-gray-500">
                    아직 기록된 가격이 없습니다.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        {/* ... thead ... */}
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-4">출처</th>
                                <th className="px-6 py-4">구매 정보 (총액)</th>
                                <th className="px-6 py-4">단가 환산 ({ingredientUnit.toLowerCase()}당)</th>
                                <th className="px-6 py-4 text-right">날짜</th>
                                <th className="px-6 py-4 text-center bg-blue-50 text-blue-700">관리 (수정/삭제)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {prices.map((p) => (
                                <PriceRow
                                    key={p.id}
                                    price={p}
                                    isLowest={p.id === lowestPriceId}
                                    isEditing={editingId === p.id}
                                    onEdit={() => handleEdit(p.id)}
                                    onCancel={handleCancel}
                                    onSaveSuccess={() => setEditingId(null)}
                                    ingredientUnit={ingredientUnit}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function PriceRow({ price, isLowest, isEditing, onEdit, onCancel, onSaveSuccess, ingredientUnit }: {
    price: PriceRecord;
    isLowest: boolean;
    isEditing: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSaveSuccess: () => void;
    ingredientUnit: string;
}) {
    // ... existing state and logic

    // Calculate display price in the Ingredient's Preferred Unit
    // price.price is usually per 'g' or 'ml' (normalized)
    // ingredientUnit might be 'kg', 'l', etc.
    // convertPriceForDisplay(price, fromUnit, toUnit)
    const displayUnitPrice = convertPriceForDisplay(price.price, price.unit, ingredientUnit);

    if (isEditing) {
        // ... existing edit form (return logic)
        // Keeping existing edit form
        return (
            <tr className="bg-yellow-50 border-2 border-yellow-400 shadow-lg relative z-10">
                <td colSpan={5} className="p-4">
                    <form action={handleSave} className="flex flex-wrap items-end gap-3">
                        {/* ... Source ... */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-500">출처</span>
                            <input
                                name="source"
                                defaultValue={defaultSource}
                                className="w-28 rounded-md border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                                required
                            />
                        </div>

                        {/* ... Total Price ... */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-500">총 구매가</span>
                            <input
                                name="totalPrice"
                                type="number"
                                defaultValue={defaultTotal}
                                className="w-28 rounded-md border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                                required
                            />
                        </div>

                        {/* ... Amount ... */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-500">수량 ({defaultUnit})</span>
                            <input
                                name="amount"
                                type="number"
                                step="any"
                                defaultValue={defaultAmount}
                                className="w-20 rounded-md border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                                required
                            />
                        </div>

                        {/* ... Unit ... */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-500">단위</span>
                            <input
                                name="unit"
                                defaultValue={defaultUnit.toLowerCase()}
                                placeholder="g, kg, ml..."
                                className="w-20 rounded-md border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white lowercase"
                                required
                            />
                        </div>

                        {/* ... Date ... */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-500">날짜</span>
                            <input
                                name="recordedAt"
                                type="date"
                                defaultValue={defaultDate}
                                className="rounded-md border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2 mb-[1px] ml-auto">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="rounded-md bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-green-500 disabled:opacity-50 transition-all flex items-center gap-1"
                            >
                                {isSaving ? "..." : <><Check className="h-4 w-4" /> 저장</>}
                            </button>
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={isSaving}
                                className="rounded-md bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all flex items-center gap-1"
                            >
                                <X className="h-4 w-4" /> 취소
                            </button>
                        </div>
                    </form>
                </td>
            </tr>
        );
    }

    return (
        <tr className={`hover:bg-gray-50 group border-b border-gray-100 last:border-0 transition-colors ${isLowest ? "bg-green-50/30" : ""}`}>
            <td className="px-6 py-4 font-medium text-gray-900">
                {price.source}
                {isLowest && <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">최저가</span>}
            </td>
            <td className="px-6 py-4 text-gray-700">
                {price.totalPrice ? (
                    <div className="flex flex-col">
                        <span className="font-bold">{price.totalPrice.toLocaleString()}원</span>
                        <span className="text-xs text-gray-500">({price.amount}{price.unit.toLowerCase()})</span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>
            <td className="px-6 py-4 text-blue-600 font-bold">
                {/* Display Price converted to Ingredient Unit */}
                {displayUnitPrice.toLocaleString()}원 <span className="text-xs font-normal text-gray-400">/{ingredientUnit.toLowerCase()}</span>
            </td>
            <td className="px-6 py-4 text-right text-gray-400 text-xs">
                {new Date(price.recordedAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onEdit}
                        className="rounded p-1 hover:bg-gray-200 text-gray-500"
                        title="수정"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="rounded p-1 hover:bg-red-100 text-red-400 hover:text-red-600"
                        title="삭제"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}
