"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Trash2, ArrowUpDown, Clock, SortAsc, SortDesc } from "lucide-react";
import { getIngredientIcon } from "@/app/lib/utils";
import { deleteIngredient } from "@/app/ingredients/actions";

type Price = {
    price: number;
    recordedAt: Date;
    source: string;
};

type Ingredient = {
    id: number;
    name: string;
    unit: string;
    createdAt: Date;
    prices: Price[];
};

type Props = {
    initialIngredients: Ingredient[];
};

type SortType = "name" | "createdAt" | "unit" | "price";
type SortOrder = "asc" | "desc";

export default function IngredientList({ initialIngredients }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortType, setSortType] = useState<SortType>("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const getPriceAnalysis = (name: string, prices: Price[]) => {
        const latest = prices[0]?.price || 0;
        const previous = prices[1]?.price || null;

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const weekPrices = prices.filter(p => new Date(p.recordedAt) >= weekAgo);
        const monthPrices = prices.filter(p => new Date(p.recordedAt) >= monthAgo);

        const weekAvg = weekPrices.length > 0
            ? Math.round(weekPrices.reduce((acc, p) => acc + p.price, 0) / weekPrices.length)
            : 0;

        const monthAvg = monthPrices.length > 0
            ? Math.round(monthPrices.reduce((acc, p) => acc + p.price, 0) / monthPrices.length)
            : 0;

        // Mock Market Data Comparison
        const mockMarketPrice = name.includes("양파") ? 2500 : name.includes("무") ? 1500 : 2000;
        const marketStatus = (avg: number) => {
            if (avg === 0) return null;
            if (avg < mockMarketPrice * 0.9) return "BEST";
            if (avg > mockMarketPrice * 1.1) return "BAD";
            return "GOOD";
        };

        return {
            latest,
            previous,
            weekAvg,
            monthAvg,
            weekStatus: marketStatus(weekAvg),
            monthStatus: marketStatus(monthAvg)
        };
    };

    const filteredAndSortedIngredients = initialIngredients
        .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            let comparison = 0;
            if (sortType === "name") {
                comparison = a.name.localeCompare(b.name);
            } else if (sortType === "unit") {
                comparison = a.unit.localeCompare(b.unit);
            } else if (sortType === "createdAt") {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortType === "price") {
                comparison = (a.prices?.[0]?.price || 0) - (b.prices?.[0]?.price || 0);
            }

            return sortOrder === "asc" ? comparison : -comparison;
        });

    const toggleSort = (type: SortType) => {
        if (sortType === type) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortType(type);
            setSortOrder("asc");
        }
    };

    return (
        <div className="space-y-6">
            {/* Search and Sort Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <input
                        type="text"
                        placeholder="재료 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                    <button
                        onClick={() => toggleSort("createdAt")}
                        className={`flex whitespace-nowrap items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${sortType === "createdAt" ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm" : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
                            }`}
                    >
                        <Clock className="h-3.5 w-3.5" />
                        등록순 {sortType === "createdAt" && (sortOrder === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}
                    </button>
                    <button
                        onClick={() => toggleSort("price")}
                        className={`flex whitespace-nowrap items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${sortType === "price" ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm" : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
                            }`}
                    >
                        가격순 {sortType === "price" && (sortOrder === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}
                    </button>
                    <button
                        onClick={() => toggleSort("name")}
                        className={`flex whitespace-nowrap items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${sortType === "name" ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm" : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
                            }`}
                    >
                        가나다순 {sortType === "name" && (sortOrder === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}
                    </button>
                </div>
            </div>

            {/* List Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedIngredients.map((item) => {
                    const { latest, previous, weekAvg, monthAvg, weekStatus, monthStatus } = getPriceAnalysis(item.name, item.prices);

                    return (
                        <div
                            key={item.id}
                            className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-xl hover:-translate-y-1"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-3xl shadow-inner border border-blue-100/50">
                                            {getIngredientIcon(item.name)}
                                        </div>
                                        <div>
                                            <Link href={`/ingredients/${item.id}`} className="block font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
                                                {item.name}
                                            </Link>
                                            <span className="text-[10px] font-bold text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded uppercase">
                                                {item.unit}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex flex-col items-end">
                                            <p className="text-xl font-black text-gray-900">
                                                {latest > 0 ? `${latest.toLocaleString()}원` : "기록 없음"}
                                            </p>
                                            <div className="mt-1 flex gap-1">
                                                {monthAvg > 0 && (
                                                    <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                                        평균 {monthAvg.toLocaleString()}원
                                                    </span>
                                                )}
                                                {previous && (
                                                    <span className="text-[9px] font-medium text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded line-through decoration-gray-300">
                                                        {previous.toLocaleString()}원
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Analysis Section */}
                                <div className="grid grid-cols-1 gap-2 pt-4 border-t border-gray-50">
                                    <div className="flex items-center justify-between bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400">7일 평균</p>
                                            <p className="text-sm font-black text-gray-700">
                                                {weekAvg > 0 ? `${weekAvg.toLocaleString()}원` : "-"}
                                            </p>
                                        </div>
                                        {weekStatus && (
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-md shadow-sm ${weekStatus === 'BEST' ? 'bg-green-100 text-green-600' :
                                                weekStatus === 'BAD' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                시장가 대비 {weekStatus === 'BEST' ? '최저' : weekStatus === 'BAD' ? '높음' : '적정'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400">30일 평균</p>
                                            <p className="text-sm font-black text-gray-700">
                                                {monthAvg > 0 ? `${monthAvg.toLocaleString()}원` : "-"}
                                            </p>
                                        </div>
                                        {monthStatus && (
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-md shadow-sm ${monthStatus === 'BEST' ? 'bg-green-100 text-green-600' :
                                                monthStatus === 'BAD' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                시장가 대비 {monthStatus === 'BEST' ? '최저' : monthStatus === 'BAD' ? '높음' : '적정'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                                <Link
                                    href={`/ingredients/${item.id}`}
                                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    추이 분석 <ArrowRight className="h-3.5 w-3.5" />
                                </Link>

                                <form
                                    action={async () => {
                                        if (confirm("정말 이 재료를 삭제하시겠습니까?")) {
                                            await deleteIngredient(item.id);
                                        }
                                    }}
                                >
                                    <button
                                        type="submit"
                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                        aria-label="재료 삭제"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredAndSortedIngredients.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                    검색 결과가 없습니다.
                </div>
            )}
        </div>
    );
}
