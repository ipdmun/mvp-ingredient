
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { Wallet, TrendingDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getMarketAnalysis } from "@/app/lib/naver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.id) {
        redirect("/login");
    }

    let ingredients: any[] = [];
    try {
        ingredients = await prisma.ingredient.findMany({
            where: {
                // @ts-ignore
                userId: (session.user as any).id,
                isDeleted: false
            },
            include: {
                prices: {
                    orderBy: { recordedAt: "desc" },
                },
            },
        });
    } catch (error) {
        console.error("Dashboard Page Data Fetch Error:", error);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate savings for each ingredient based on Market Analysis
    const rows = await Promise.all(ingredients.map(async (ingredient) => {
        const monthlyPrices = ingredient.prices.filter(
            (p: any) => p.recordedAt >= startOfMonth
        );

        if (monthlyPrices.length === 0) {
            return {
                id: ingredient.id,
                name: ingredient.name,
                savings: 0,
                unit: ingredient.unit,
            };
        }

        let ingredientSavings = 0;

        for (const p of monthlyPrices) {
            // Calculate User Total Price and Amount
            // If totalPrice/amount is missing, derive from unit price (fallback)
            const amount = p.amount || 1;
            const userTotal = p.totalPrice || (p.price * amount);

            try {
                const analysis = await getMarketAnalysis(ingredient.name, userTotal, ingredient.unit, amount);
                if (analysis) {
                    // totalDiff = UserPrice - MarketPrice
                    // If totalDiff < 0 (e.g. -2000): User Price (8000) < Market (10000). Saved 2000.
                    // If totalDiff > 0 (e.g. +1000): User Price (11000) > Market (10000). Lost 1000.

                    // We want to calculate "Net Savings".
                    // Savings = MarketPrice - UserPrice = -totalDiff
                    ingredientSavings += (-analysis.totalDiff);
                }
            } catch (err) {
                console.error(`Market Analysis Error for ${ingredient.name}:`, err);
            }
        }

        return {
            id: ingredient.id,
            name: ingredient.name,
            savings: ingredientSavings,
            unit: ingredient.unit,
        };
    }));

    const totalSavings = rows.reduce((acc: number, r: any) => acc + r.savings, 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">대시보드</h1>
                <p className="text-gray-500">이번 달 식자재 비용 절감 현황을 확인하세요.</p>
            </div>

            {/* 메인 요약 카드 */}
            <div className={`relative overflow-hidden rounded-2xl p-8 text-white shadow-lg ${totalSavings >= 0 ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-gradient-to-br from-red-500 to-orange-600'}`}>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-white/90">
                        <div className="rounded-full bg-white/20 p-2">
                            {totalSavings >= 0 ? <Wallet className="h-6 w-6 text-white" /> : <TrendingDown className="h-6 w-6 text-white" />}
                        </div>
                        <span className="font-semibold tracking-wide">
                            {totalSavings >= 0 ? "이번 달 총 절감액" : "이번 달 총 초과 지출"}
                        </span>
                    </div>
                    <div className="mt-4 text-5xl font-extrabold tracking-tight">
                        {totalSavings >= 0 ? `₩${totalSavings.toLocaleString()}` : `-₩${Math.abs(totalSavings).toLocaleString()}`}
                    </div>
                    <p className="mt-2 text-white/80">
                        {totalSavings >= 0
                            ? "스마트한 구매로 아낀 소중한 비용입니다. 👏"
                            : "시장가보다 조금 더 비싸게 구매하셨네요. 🥲"
                        }
                    </p>
                </div>
                {/* 배경 장식 */}
                <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
            </div>

            {/* 재료별 기여도 */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-gray-500" />
                    재료별 기여도
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rows.sort((a, b) => Math.abs(b.savings) - Math.abs(a.savings)).map((row) => (
                        <div
                            key={row.id}
                            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="flex flex-col gap-1">
                                <span className="font-bold text-gray-900 text-lg">{row.name}</span>
                                <span className="inline-flex w-fit items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                    {row.unit} 기준
                                </span>
                            </div>
                            <div className={`text-xl font-bold ${row.savings >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                {row.savings >= 0 ? `+${row.savings.toLocaleString()}원` : `${row.savings.toLocaleString()}원`}
                            </div>
                        </div>
                    ))}
                </div>

                {rows.length === 0 && (
                    <div className="mt-4 text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        구매 내역이 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
```
