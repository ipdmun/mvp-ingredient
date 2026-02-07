"use client";

import { useState } from "react";
import { updateIngredientPrice, deleteIngredientPrice } from "../actions";
import { Edit2, Trash2, Check, X } from "lucide-react";

type PriceRecord = {
    id: number;
    price: number; // Unit Price
    totalPrice: number | null;
    amount: number | null;
    unit: string;
    source: string;
    recordedAt: string | Date; // Allow string from JSON serialization
    marketData?: any;
};

type Props = {
    prices: PriceRecord[];
    lowestPriceId?: number;
};

export default function PriceHistoryTableV2({ prices, lowestPriceId }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);

    const handleEdit = (id: number) => {
        setEditingId(id);
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {prices.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                    아직 기록된 가격이 없습니다.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-4">출처</th>
                                <th className="px-6 py-4">구매 정보 (총액)</th>
                                <th className="px-6 py-4">단가 환산</th>
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
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function PriceRow({ price, isLowest, isEditing, onEdit, onCancel, onSaveSuccess }: {
    price: PriceRecord;
    isLowest: boolean;
    isEditing: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSaveSuccess: () => void;
}) {
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form defaults
    const defaultTotal = price.totalPrice || price.price;
    const defaultAmount = price.amount || 1;
    const defaultUnit = price.unit;
    const defaultSource = price.source;
    // Format date for input [YYYY-MM-DD]
    const defaultDate = new Date(price.recordedAt).toISOString().split('T')[0];

    const handleSave = async (formData: FormData) => {
        setIsSaving(true);
        try {
            await updateIngredientPrice(price.id, formData);
            onSaveSuccess();
        } catch (e) {
            console.error(e);
            alert("수정 실패");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        setIsSaving(true);
        try {
            await deleteIngredientPrice(price.id);
        } catch (e) {
            console.error(e);
            alert("삭제 실패");
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditing) {
        return (
            <tr className="bg-blue-50/50">
                <td colSpan={5} className="p-4">
                    <form action={handleSave} className="flex flex-wrap items-center gap-3">
                        {/* Source */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-500">출처</span>
                            <input
                                name="source"
                                defaultValue={defaultSource}
                                className="w-24 rounded border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Total Price */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-500">총 구매가</span>
                            <input
                                name="totalPrice"
                                type="number"
                                defaultValue={defaultTotal}
                                className="w-24 rounded border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Amount */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-500">수량</span>
                            <input
                                name="amount"
                                type="number"
                                step="0.01"
                                defaultValue={defaultAmount}
                                className="w-16 rounded border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Unit */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-500">단위</span>
                            <input
                                name="unit"
                                defaultValue={defaultUnit}
                                className="w-16 rounded border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Date */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-500">날짜</span>
                            <input
                                name="recordedAt"
                                type="date"
                                defaultValue={defaultDate}
                                className="rounded border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2 mt-auto pb-1 ml-auto">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
                            >
                                {isSaving ? "..." : <Check className="h-4 w-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={isSaving}
                                className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </form>
                </td>
            </tr>
        );
    }

    return (
        <tr className={`hover:bg-gray-50 group ${isLowest ? "bg-green-50/50" : ""}`}>
            <td className="px-6 py-4 font-medium text-gray-900">
                {price.source}
                {isLowest && <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">최저가</span>}
            </td>
            <td className="px-6 py-4 text-gray-700">
                {price.totalPrice ? (
                    <div className="flex flex-col">
                        <span className="font-bold">{price.totalPrice.toLocaleString()}원</span>
                        <span className="text-xs text-gray-500">({price.amount}{price.unit})</span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>
            <td className="px-6 py-4 text-blue-600 font-bold">
                {/* Unit Price Calculation Display */}
                {Math.round(price.price).toLocaleString()}원 <span className="text-xs font-normal text-gray-400">/{price.unit === 'g' || price.unit === 'ml' ? price.unit : '1' + price.unit}</span>
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
