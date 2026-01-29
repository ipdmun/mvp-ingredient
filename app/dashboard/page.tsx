
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Wallet, TrendingDown, ArrowRight } from "lucide-react";
import Link from "next/link";

export const runtime = "nodejs";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        redirect("/login");
    }

    const ingredients = await prisma.ingredient.findMany({
        where: { userId: session.user.id },
        include: {
            prices: {
                orderBy: { recordedAt: "desc" },
            },
        },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const rows = ingredients.map((ingredient) => {
        const monthlyPrices = ingredient.prices.filter(
            (p) => p.recordedAt >= startOfMonth
        );

        if (monthlyPrices.length === 0) {
            return {
                id: ingredient.id,
                name: ingredient.name,
                savings: 0,
                unit: ingredient.unit,
            };
        }

        const sum = monthlyPrices.reduce((acc, p) => acc + p.price, 0);
        const avg = sum / monthlyPrices.length;
        const min = Math.min(...monthlyPrices.map((p) => p.price));

        // @ts-ignore
        const monthlyUsage = ingredient.monthlyUsage ?? 10;

        const savings = Math.floor(Math.max((avg - min) * monthlyUsage, 0));

        return {
            id: ingredient.id,
            name: ingredient.name,
            savings,
            unit: ingredient.unit,
        };
    });

    const totalSavings = rows.reduce((acc, r) => acc + r.savings, 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">대시보드</h1>
                <p className="text-gray-500">이번 달 식자재 비용 절감 현황을 확인하세요.</p>
            </div>

            {/* 메인 요약 카드 */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-blue-100">
                        <div className="rounded-full bg-white/20 p-2">
                            <Wallet className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-semibold tracking-wide">이번 달 총 절감액</span>
                    </div>
                    <div className="mt-4 text-5xl font-extrabold tracking-tight">
                        ₩{totalSavings.toLocaleString()}
                    </div>
                    <p className="mt-2 text-blue-100">
                        스마트한 구매로 아낀 소중한 비용입니다. 👏
                    </p>
                </div>
                {/* 배경 장식 */}
                <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
            </div>

            {/* 재료별 리스트 */}
            <div>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                    <TrendingDown className="h-5 w-5 text-green-600" />
                    재료별 기여도
                </h2>

                {rows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                        아직 데이터가 없습니다. 재료와 가격을 추가해보세요!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {rows.map((row) => (
                            <Link
                                href={`/ingredients/${row.id}`}
                                key={row.id}
                                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{row.name}</h3>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{row.unit} 기준</span>
                                    </div>
                                    <div className={`text-lg font-bold ${row.savings > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        +{row.savings.toLocaleString()}원
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-end text-sm font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                                    상세보기 <ArrowRight className="ml-1 h-4 w-4" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
