"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, ArrowRight, ArrowUpDown, Clock, SortAsc, SortDesc, Loader2 } from "lucide-react";
import { getIngredientIcon } from "@/app/lib/utils";
import { deleteIngredient, refreshIngredientPrice } from "@/app/ingredients/actions";

type Price = {
    price: number;
    recordedAt: Date;
    source: string;
    marketData?: any; // JSON
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
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortType, setSortType] = useState<SortType>("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const getPriceAnalysis = (name: string, prices: Price[]) => {
        const latestPriceObj = prices[0];
        const latest = latestPriceObj?.price || 0;
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

        // Use stored marketData if available
        let latestMarketData = null;
        if (latestPriceObj && latestPriceObj.marketData) {
            latestMarketData = latestPriceObj.marketData as any;
        }

        return {
            latest,
            previous,
            weekAvg,
            monthAvg,
            marketData: latestMarketData
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

    const [refreshingId, setRefreshToken] = useState<number | null>(null);

    const handleRefreshPrice = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        setRefreshToken(id);

        try {
            await refreshIngredientPrice(id);
        } catch (error) {
            console.error("Failed to refresh price", error);
        } finally {
            setRefreshToken(null);
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
                    const { latest, previous, weekAvg, monthAvg, marketData } = getPriceAnalysis(item.name, item.prices);

                    return (
                        <div
                            key={item.id}
                            onClick={() => router.push(`/ingredients/${item.id}`)}
                            className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-3xl shadow-inner border border-blue-100/50 overflow-hidden">
                                            {getIngredientIcon(item.name).startsWith("/") ? (
                                                <img src={getIngredientIcon(item.name)} alt={item.name} className="h-full w-full object-contain p-1 mix-blend-multiply" />
                                            ) : (
                                                getIngredientIcon(item.name)
                                            )}
                                        </div>
                                        <div>
                                            <div className="block font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
                                                {item.name}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded uppercase">
                                                {item.unit.toLowerCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex flex-col items-end">
                                            <p className="text-xl font-black text-gray-900">
                                                {latest > 0 ? `${latest.toLocaleString()}원` : "기록 없음"}
                                            </p>
                                            <div className="mt-1 flex gap-1">
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
                                    {/* Market Data (Naver) */}
                                    {marketData ? (
                                        <div
                                            onClick={(e) => handleRefreshPrice(e, item.id)}
                                            className="group/badge cursor-pointer flex flex-col gap-2 bg-blue-50/50 rounded-xl p-3 border border-blue-100/50 hover:bg-blue-100/50 transition-colors relative overflow-hidden"
                                        >
                                            {refreshingId === item.id && (
                                                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#03C75A] text-[10px] font-black text-white">N</span>
                                                    <span className="text-xs font-bold text-gray-700">네이버 최저가</span>
                                                </div>
                                                <span className={`text-xs font-black px-2 py-1 rounded-md shadow-sm ${marketData.diff > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {marketData.diff > 0 ? `+${marketData.diff.toLocaleString()}` : `${marketData.diff.toLocaleString()}`}
                                                </span>
                                            </div>

                                            <div className="flex items-baseline justify-between">
                                                {marketData.link ? (
                                                    <a
                                                        href={marketData.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-xs text-blue-500 underline truncate max-w-[60%] hover:text-blue-700 transition-colors"
                                                    >
                                                        {marketData.cheapestSource.replace("네이버최저가(", "").replace(")", "")}
                                                    </a>
                                                ) : (
                                                    <p className="text-xs text-gray-400 truncate max-w-[60%] group-hover/badge:text-gray-600 transition-colors">
                                                        {marketData.cheapestSource.replace("네이버최저가(", "").replace(")", "")}
                                                    </p>
                                                )}
                                                <p className="text-lg font-black text-gray-900">
                                                    {marketData.price.toLocaleString()}원
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={(e) => handleRefreshPrice(e, item.id)}
                                            className="flex cursor-pointer items-center justify-between bg-gray-50/50 rounded-xl p-3 border border-gray-100/50 hover:bg-gray-100 transition-colors relative"
                                        >
                                            {refreshingId === item.id && (
                                                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                                                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400">7일 평균</p>
                                                <p className="text-sm font-black text-gray-700">
                                                    {weekAvg > 0 ? `${weekAvg.toLocaleString()}원` : "-"}
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-medium text-gray-400 group-hover:text-blue-500">
                                                최저가 확인
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                                <Link
                                    href={`/ingredients/${item.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    추이 분석 <ArrowRight className="h-3.5 w-3.5" />
                                </Link>

                                <form
                                    onClick={(e) => e.stopPropagation()}
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
