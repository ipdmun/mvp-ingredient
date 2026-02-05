"use client";

import { useState, useMemo } from "react";
import { TrendingDown, TrendingUp, Calendar, Info } from "lucide-react";

type PriceRecord = {
    id: number;
    price: number; // Unit Price
    totalPrice?: number | null;
    amount?: number | null;
    unit: string;
    source: string;
    recordedAt: Date;
};

type Props = {
    prices: PriceRecord[];
    unit: string;
    lowestPrice: { price: number; source: string } | null;
};

export default function IngredientPriceSummary({ prices, unit, lowestPrice }: Props) {
    const [period, setPeriod] = useState<"7d" | "1m" | "all">("1m");

    const filteredPrices = useMemo(() => {
        const now = new Date();
        return prices.filter((p) => {
            const date = new Date(p.recordedAt);
            if (period === "7d") {
                const sevenDaysAgo = new Date(now);
                sevenDaysAgo.setDate(now.getDate() - 7);
                return date >= sevenDaysAgo;
            }
            if (period === "1m") {
                const oneMonthAgo = new Date(now);
                oneMonthAgo.setMonth(now.getMonth() - 1);
                return date >= oneMonthAgo;
            }
            return true;
        });
    }, [prices, period]);

    const averagePrice = useMemo(() => {
        if (filteredPrices.length === 0) return 0;

        const totalSpend = filteredPrices.reduce((acc, p) => {
            // Use totalPrice if available, otherwise estimate from price * amount, or just price
            const spending = p.totalPrice ?? (p.price * (p.amount ?? 1));
            return acc + spending;
        }, 0);

        const totalAmount = filteredPrices.reduce((acc, p) => {
            return acc + (p.amount ?? 1);
        }, 0);

        if (totalAmount === 0) return 0;

        return Math.round(totalSpend / totalAmount);
    }, [filteredPrices]);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    📊 내 구매 분석
                </h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setPeriod("7d")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === "7d" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                            }`}
                    >
                        7일
                    </button>
                    <button
                        onClick={() => setPeriod("1m")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === "1m" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                            }`}
                    >
                        1달
                    </button>
                    <button
                        onClick={() => setPeriod("all")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${period === "all" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                            }`}
                    >
                        전체
                    </button>
                </div>
            </div>

            {filteredPrices.length > 0 ? (
                <div className="space-y-6">
                    {/* Main: Average Price */}
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">평균 구매가 ({period === 'all' ? '전체' : period === '7d' ? '최근 7일' : '최근 1달'})</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-gray-900 tracking-tight">
                                {averagePrice.toLocaleString()}
                            </span>
                            <span className="text-lg font-bold text-gray-400">원 /{unit}</span>
                        </div>
                    </div>

                    {/* Comparison with Current Lowest */}
                    {lowestPrice && (
                        <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full ${lowestPrice.price < averagePrice ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {lowestPrice.price < averagePrice ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">
                                        현재 최저가: {lowestPrice.price.toLocaleString()}원
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        출처: {lowestPrice.source}
                                    </p>
                                    <p className={`text-xs font-bold mt-2 ${lowestPrice.price < averagePrice ? 'text-red-500' : 'text-green-600'}`}>
                                        {lowestPrice.price < averagePrice
                                            ? `평균보다 ${Math.abs(averagePrice - lowestPrice.price).toLocaleString()}원 더 저렴해요!`
                                            : `평균보다 ${Math.abs(lowestPrice.price - averagePrice).toLocaleString()}원 비싸요.`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <HistoryIcon className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-400">이 기간의 구매 기록이 없어요.</p>
                </div>
            )}
        </div>
    );
}

function HistoryIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    );
}
