"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

// @ts-ignore
export default function RecipeMarginAnalysis({ totalCost, sellingPrice }) {
    const margin = sellingPrice - totalCost;
    const marginRate = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
    const costRate = sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-2 flex items-center justify-between">
                <span>계산 결과</span>
                {marginRate >= 30 ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">수익성 좋음</span>
                ) : (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg">수익성 주의</span>
                )}
            </h3>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">마진율</span>
                    <span className={`text-2xl font-black ${marginRate >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                        {marginRate.toFixed(2)}%
                    </span>
                </div>

                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    <div style={{ width: `${Math.min(costRate, 100)}%` }} className="bg-gray-400 h-full" />
                    <div style={{ width: `${Math.min(Math.max(marginRate, 0), 100)}%` }} className="bg-blue-500 h-full" />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>원가율 {costRate.toFixed(1)}%</span>
                    <span>이익률 {marginRate.toFixed(1)}%</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-500 mb-1">개당 원가</p>
                        <p className="text-lg font-bold text-gray-900">{totalCost.toLocaleString()}원</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-3">
                        <p className="text-xs text-blue-600 mb-1">개당 이익</p>
                        <p className="text-lg font-bold text-blue-700">+{margin.toLocaleString()}원</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
