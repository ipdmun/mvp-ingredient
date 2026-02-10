"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, ArrowRight, ArrowUpDown, Clock, SortAsc, SortDesc, Loader2, CheckSquare, Square, X, Search, RotateCcw, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { getIngredientIcon, convertPriceForDisplay, formatIngredientName } from "@/app/lib/utils";
import { deleteIngredient, refreshIngredientPrice, bulkDeleteIngredients } from "@/app/ingredients/actions";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import PriceAnalysisModal from "./PriceAnalysisModal";
import { Sparkles, Calendar } from "lucide-react";

type Price = {
    price: number;
    recordedAt: Date | string;
    source: string;
    totalPrice?: number | null;
    amount?: number | null;
    marketData?: any; // JSON
    unit: string;
    type?: string;
};

type Ingredient = {
    id: number;
    name: string;
    unit: string;
    createdAt: Date | string;
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

    // Helper to hydrate dates
    const hydrateIngredients = (data: Ingredient[]) => {
        return data.map(item => ({
            ...item,
            createdAt: new Date(item.createdAt),
            prices: item.prices.map(p => ({
                ...p,
                recordedAt: new Date(p.recordedAt)
            }))
        }));
    };

    // Selection State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Feature: Candidate Selection (Up/Down)
    const [selectedCandidates, setSelectedCandidates] = useState<Record<number, number>>({});

    // Feature: Price History Graph
    const [expandedGraphId, setExpandedGraphId] = useState<number | null>(null);

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
            ? weekPrices.reduce((acc, p) => acc + p.price, 0) / weekPrices.length
            : 0;

        const monthAvg = monthPrices.length > 0
            ? monthPrices.reduce((acc, p) => acc + p.price, 0) / monthPrices.length
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

    // Local state for Optimistic UI
    const [ingredients, setIngredients] = useState<Ingredient[]>(() => hydrateIngredients(initialIngredients));

    // Sync with server data if it changes (e.g. after router.refresh)
    useEffect(() => {
        setIngredients(hydrateIngredients(initialIngredients));
    }, [initialIngredients]);

    const filteredAndSortedIngredients = useMemo(() => {
        return ingredients
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
    }, [ingredients, searchTerm, sortType, sortOrder]);

    const toggleSort = (type: SortType) => {
        if (sortType === type) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortType(type);
            setSortOrder("asc");
        }
    };

    const [refreshingId, setRefreshToken] = useState<number | null>(null);

    // AI Analysis State
    const [analysisDate, setAnalysisDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [analysisReport, setAnalysisReport] = useState<string[] | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const resp = await fetch(`/api/ingredients/analyze?date=${analysisDate}`);
            const data = await resp.json();
            if (data.report) {
                setAnalysisReport(data.report);
                setIsAnalysisModalOpen(true);
            } else {
                alert(data.error || "분석할 데이터가 없습니다.");
            }
        } catch (error) {
            console.error(error);
            alert("분석 중 오류가 발생했습니다.");
        } finally {
            setIsAnalyzing(false);
        }
    };

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

    // Selection Handlers
    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredAndSortedIngredients.length && filteredAndSortedIngredients.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredAndSortedIngredients.map(item => item.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`선택한 ${selectedIds.length}개의 재료를 정말 삭제하시겠습니까?`)) return;

        // Optimistic Update
        const idsToDelete = [...selectedIds];
        setIngredients(prev => prev.filter(item => !idsToDelete.includes(item.id)));
        setSelectedIds([]);

        setIsDeleting(true);
        try {
            await bulkDeleteIngredients(idsToDelete);
            router.refresh();
        } catch (error) {
            alert("삭제 중 오류가 발생했습니다.");
            console.error(error);
            // Revert or refresh on error?
            router.refresh();
        } finally {
            setIsDeleting(false);
        }
    };

    // Helper for Date Formatting (M/D)
    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    };

    // Helper for Amount Display (20000g -> 20kg)
    const formatAmount = (amount: number, unit: string) => {
        if (unit === 'g' && amount >= 1000) {
            return `${amount / 1000}kg`;
        }
        if ((unit === 'ml' || unit === 'l') && amount >= 1000) {
            return `${amount / 1000}L`;
        }
        return `${amount}${unit}`;
    };

    return (
        <div className="space-y-6">
            {/* Search and Sort Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-20 bg-white/80 backdrop-blur-md py-4 -my-4 px-1">
                <div className="flex items-center gap-2 flex-1">
                    {/* Select All Checkbox */}
                    <button
                        onClick={handleSelectAll}
                        className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${selectedIds.length > 0 && selectedIds.length === filteredAndSortedIngredients.length
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-gray-200 text-gray-500 hover:border-blue-400"
                            }`}
                    >
                        {selectedIds.length > 0 && selectedIds.length === filteredAndSortedIngredients.length ? (
                            <CheckSquare className="h-5 w-5" />
                        ) : (
                            <Square className="h-5 w-5" />
                        )}
                        <span className="text-sm font-bold whitespace-nowrap">
                            {selectedIds.length > 0 ? "전체 해제" : "전체 선택"}
                        </span>
                    </button>

                    {/* Bulk Delete Button */}
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors animate-in fade-in slide-in-from-left-2"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Trash2 className="h-5 w-5" />
                            )}
                            <span className="text-sm hidden sm:inline">
                                {selectedIds.length}개 삭제
                            </span>
                        </button>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="식자재 검색..."
                                className="w-full rounded-xl border-gray-200 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-blue-500 lg:w-64 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* AI Analysis Tool */}
                        <div className="flex items-center gap-2 bg-purple-50 p-1.5 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-1.5 px-2 text-purple-700">
                                <Calendar className="h-4 w-4" />
                                <input
                                    type="date"
                                    className="bg-transparent border-none p-0 text-xs font-bold focus:ring-0 cursor-pointer"
                                    value={analysisDate}
                                    onChange={(e) => setAnalysisDate(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleRunAnalysis}
                                disabled={isAnalyzing}
                                className="flex items-center gap-1.5 bg-purple-600 px-4 py-1.5 rounded-lg text-xs font-black text-white hover:bg-purple-700 transition-all shadow-sm shadow-purple-200 disabled:opacity-50"
                            >
                                {isAnalyzing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3.5 w-3.5" />
                                )}
                                AI 분석
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* selection/delete buttons */}
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                                    {selectedIds.length}개 선택됨
                                </span>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-all border border-red-100"
                                >
                                    {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                    일괄 삭제
                                </button>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="선택 취소"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
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
                    </div>
                </div>
            </div>

            {/* List Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedIngredients.map((item) => {
                    const { latest, previous, weekAvg, monthAvg, marketData } = getPriceAnalysis(item.name, item.prices);
                    const isSelected = selectedIds.includes(item.id);
                    const latestPrice = item.prices[0];

                    // Unit Price Display Logic (Convert g -> kg for main display if needed)
                    let displayUnitPrice = latest;
                    let displayUnit = item.unit;

                    if (item.unit === 'g') {
                        displayUnitPrice = latest * 1000;
                        displayUnit = 'kg';
                    } else if (item.unit === 'ml') {
                        displayUnitPrice = latest * 1000;
                        displayUnit = 'L';
                    }

                    return (
                        <div
                            key={item.id}
                            onClick={() => {
                                // If in selection mode (at least one selected), clicking card toggles selection
                                // Otherwise navigates
                                if (selectedIds.length > 0) {
                                    toggleSelection(item.id);
                                } else {
                                    router.push(`/ingredients/${item.id}`);
                                }
                            }}
                            className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-xl cursor-pointer
                                ${isSelected
                                    ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/10"
                                    : "border-gray-100 hover:border-blue-200 hover:-translate-y-1"
                                }`}
                        >
                            {/* Card Checkbox Overlay (Always visible on hover or if selected) */}
                            <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => toggleSelection(item.id)}
                                    className={`p-1 rounded-md transition-all ${isSelected
                                        ? "text-blue-600 bg-white shadow-sm ring-1 ring-blue-100"
                                        : "text-gray-300 hover:text-blue-400 bg-white/0 hover:bg-white"
                                        }`}
                                >
                                    {isSelected ? <CheckSquare className="h-6 w-6" /> : <Square className="h-6 w-6" />}
                                </button>
                            </div>

                            <div className="space-y-4 pl-8"> {/* Add padding left for checkbox space */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-3xl shadow-inner border border-blue-100/50 overflow-hidden shrink-0">
                                            {getIngredientIcon(item.name).startsWith("/") ? (
                                                <img src={getIngredientIcon(item.name)} alt={item.name} className="h-full w-full object-contain p-1 mix-blend-multiply" />
                                            ) : (
                                                getIngredientIcon(item.name)
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="block font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg truncate" title={formatIngredientName(item.name)}>
                                                {formatIngredientName(item.name)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 min-w-[100px]">
                                        <div className="flex flex-col items-end">
                                            <p className="text-lg sm:text-xl font-black text-gray-900 truncate w-full">
                                                {latest > 0
                                                    ? `${Math.round(convertPriceForDisplay(latest, item.prices[0]?.unit || 'g', displayUnit)).toLocaleString()}원/${displayUnit}`
                                                    : "기록 없음"
                                                }
                                            </p>

                                            {/* Recent History Detail */}
                                            {latestPrice && (
                                                <div className="mt-1 flex flex-col items-end gap-0.5">
                                                    <p className="text-[10px] text-gray-400 font-medium">
                                                        {formatDate(latestPrice.recordedAt)}
                                                        {' '}
                                                        {latestPrice.amount ? formatAmount(latestPrice.amount, latestPrice.unit) : ''}
                                                        {' '}
                                                        {latestPrice.totalPrice ? `${latestPrice.totalPrice.toLocaleString()}원` : ''}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                                        ({Math.round(convertPriceForDisplay(latestPrice.price, latestPrice.unit, displayUnit)).toLocaleString()}원/{displayUnit})
                                                    </p>
                                                </div>
                                            )}
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

                                            {/* Logic to determine current candidate */}
                                            {(() => {
                                                const candidates = marketData.candidates || [marketData];
                                                const selectedIndex = selectedCandidates[item.id] || 0;
                                                const currentCandidate = candidates[selectedIndex] || candidates[0];

                                                // Re-calculate Diff for display
                                                // marketData.diff is unit diff (e.g. per gram)
                                                // To get total diff, we need user's normalized amount
                                                const userAmount = item.prices[0]?.amount || 1;
                                                const userTotalEstimated = marketData.price + (marketData.diff * userAmount);
                                                const currentDiff = userTotalEstimated - currentCandidate.price;

                                                const handlePrev = (e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    setSelectedCandidates(prev => ({
                                                        ...prev,
                                                        [item.id]: Math.max(0, (prev[item.id] || 0) - 1)
                                                    }));
                                                };

                                                const handleNext = (e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    setSelectedCandidates(prev => ({
                                                        ...prev,
                                                        [item.id]: Math.min(candidates.length - 1, (prev[item.id] || 0) + 1)
                                                    }));
                                                };

                                                return (
                                                    <>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#03C75A] text-[10px] font-black text-white">N</span>
                                                                <span className="text-xs font-bold text-gray-700">네이버 최저가</span>

                                                                {/* Up/Down Buttons */}
                                                                {candidates.length > 1 && (
                                                                    <div className="flex flex-col ml-1 gap-0.5">
                                                                        <button
                                                                            onClick={handlePrev}
                                                                            disabled={selectedIndex <= 0}
                                                                            className="flex items-center justify-center w-5 h-4 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-20 transition-colors"
                                                                        >
                                                                            <span className="text-[8px] scale-x-125">▲</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={handleNext}
                                                                            disabled={selectedIndex >= candidates.length - 1}
                                                                            className="flex items-center justify-center w-5 h-4 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-20 transition-colors"
                                                                        >
                                                                            <span className="text-[8px] scale-x-125">▼</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {candidates.length > 1 && (
                                                                    <span className="text-[9px] text-gray-400 ml-1 font-medium bg-gray-100 px-1.5 py-0.5 rounded italic">
                                                                        {selectedIndex + 1} / {candidates.length}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* [Price Comparison Logic Refinement] */}
                                                        {marketData && (
                                                            <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-sm font-bold text-gray-800">{marketData.cheapestSource}</span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <span className="font-bold text-gray-900 text-lg">
                                                                            {/* Primary: Total Price matching user amount */}
                                                                            {marketData.marketTotalForUserAmount
                                                                                ? marketData.marketTotalForUserAmount.toLocaleString()
                                                                                : marketData.price.toLocaleString()}원
                                                                        </span>
                                                                        <span className="text-gray-300">|</span>
                                                                        <span className="text-gray-500 font-medium">
                                                                            {/* Secondary: Unit Price */}
                                                                            {marketData.marketUnitPrice
                                                                                ? `${Math.round(marketData.marketUnitPrice).toLocaleString()}원`
                                                                                : `${marketData.price.toLocaleString()}원`}
                                                                            <span className="text-xs text-gray-400 font-normal ml-0.5">({item.unit}당)</span>
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center justify-between mt-1">
                                                                        <a href={marketData.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-400 underline hover:text-blue-500">
                                                                            상품 보러가기
                                                                        </a>

                                                                        {/* Diff Display: Loss/Profit */}
                                                                        {marketData.totalDiff !== undefined && (
                                                                            <div className="flex items-center gap-1 font-bold text-base">
                                                                                {marketData.totalDiff > 0 ? (
                                                                                    <span className="text-red-500">손해 {marketData.totalDiff.toLocaleString()}원</span>
                                                                                ) : (
                                                                                    <span className="text-blue-600">이익 {Math.abs(marketData.totalDiff).toLocaleString()}원</span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-baseline justify-between gap-2 overflow-hidden">
                                                            <a
                                                                href={currentCandidate.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-[11px] text-blue-500 underline truncate flex-1 hover:text-blue-700 transition-colors"
                                                            >
                                                                {(currentCandidate.source || currentCandidate.cheapestSource || "Unknown").replace("네이버최저가(", "").replace(")", "")}
                                                            </a>
                                                            <p className="text-lg font-black text-gray-900 shrink-0">
                                                                {currentCandidate.price.toLocaleString()}원
                                                            </p>
                                                        </div>
                                                    </>
                                                );
                                            })()}
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
                                                <p className="text-lg font-black text-gray-700">
                                                    {weekAvg > 0 ? `${Math.round(convertPriceForDisplay(weekAvg, item.prices[0]?.unit || 'g', item.unit)).toLocaleString()}원` : "-"}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div onClick={(e) => handleRefreshPrice(e, item.id)} className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded px-1 -mr-1">
                                                    <Loader2 className={`h-3 w-3 text-gray-400 ${refreshingId === item.id ? 'animate-spin' : ''}`} />
                                                    <span className="text-[10px] font-medium text-gray-400 hover:text-blue-500">
                                                        데이터 갱신
                                                    </span>
                                                </div>
                                                <a
                                                    href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(`${item.name.split(/[,(]/)[0].trim()} ${latestPrice && latestPrice.amount ? formatAmount(latestPrice.amount, latestPrice.unit) : ''}`.trim())}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-0.5"
                                                >
                                                    직접 검색 <ArrowRight className="h-2.5 w-2.5" />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 border-t border-gray-50 pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setExpandedGraphId(expandedGraphId === item.id ? null : item.id); }}
                                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${expandedGraphId === item.id ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            시세
                                        </button>
                                        <Link
                                            href={`/ingredients/${item.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            상세 <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>

                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm("정말 이 재료를 삭제하시겠습니까?")) {
                                                // Optimistic Update
                                                const previousIngredients = [...ingredients];
                                                setIngredients(prev => prev.filter(i => i.id !== item.id));

                                                try {
                                                    await deleteIngredient(item.id);
                                                    router.refresh();
                                                } catch (e) {
                                                    console.error("Delete failed", e);
                                                    alert("삭제에 실패했습니다.");
                                                    setIngredients(previousIngredients); // Revert
                                                }
                                            }
                                        }}
                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                        aria-label="재료 삭제"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {expandedGraphId === item.id && (
                                    <div className="mt-4 h-48 w-full bg-gray-50 rounded-xl p-2 border border-blue-100 animate-in slide-in-from-top-2 fade-in">
                                        <div className="flex items-center justify-between mb-2 px-2">
                                            <span className="text-xs font-bold text-gray-500">가격 추이 (최근 30일)</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setExpandedGraphId(null); }}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <ResponsiveContainer width="100%" height="80%">
                                            <LineChart data={(() => {
                                                const dataMap = new Map();
                                                const sortedPrices = [...item.prices].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

                                                const thirtyDaysAgo = new Date();
                                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                                                sortedPrices.forEach(p => {
                                                    if (new Date(p.recordedAt) < thirtyDaysAgo) return;
                                                    const dateStr = new Date(p.recordedAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });

                                                    if (!dataMap.has(dateStr)) {
                                                        dataMap.set(dateStr, { date: dateStr, myPrice: null, marketPrice: null });
                                                    }
                                                    const entry = dataMap.get(dateStr);
                                                    if ((p as any).type === 'PURCHASE' || !(p as any).type) entry.myPrice = p.price;
                                                    if ((p as any).type === 'MARKET') entry.marketPrice = p.price;
                                                });
                                                return Array.from(dataMap.values());
                                            })()}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <YAxis hide domain={['auto', 'auto']} />
                                                <RechartsTooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    labelStyle={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}
                                                    itemStyle={{ fontSize: '12px', padding: 0 }}
                                                />
                                                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '0px' }} />
                                                <Line type="monotone" dataKey="myPrice" name="내 구매가" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                                                <Line type="monotone" dataKey="marketPrice" name="시장 최저가" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
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

            {/* Scroll Buttons */}
            <div className="fixed bottom-24 right-6 flex flex-col gap-2 z-50">
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="p-3 bg-white border border-gray-200 rounded-full shadow-lg text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl transition-all"
                >
                    <ArrowRight className="h-5 w-5 -rotate-90" />
                </button>
                <button
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
                    className="p-3 bg-white border border-gray-200 rounded-full shadow-lg text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl transition-all"
                >
                    <ArrowRight className="h-5 w-5 rotate-90" />
                </button>
            </div>
            {/* Price Analysis Modal */}
            <PriceAnalysisModal
                isOpen={isAnalysisModalOpen}
                onClose={() => setIsAnalysisModalOpen(false)}
                report={analysisReport || []}
                date={analysisDate}
            />
        </div>
    );
}
