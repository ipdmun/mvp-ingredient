
import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import { createIngredientPrice, updateIngredientUsage } from "../actions";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import Link from "next/link";
import { ArrowLeft, Save, Plus, TrendingDown, Clock, CreditCard } from "lucide-react";
import AddPriceForm from "../components/AddPriceForm";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default async function IngredientDetailPage(props: Props) {
    const params = await props.params;
    const ingredientId = Number(params.id);

    if (isNaN(ingredientId)) {
        notFound();
    }

    const ingredient = await prisma.ingredient.findUnique({
        where: { id: ingredientId },
        include: {
            prices: {
                orderBy: { recordedAt: "desc" },
            },
        },
    });

    const lowestPrice = await prisma.ingredientPrice.findFirst({
        where: { ingredientId },
        orderBy: { price: "asc" },
    });

    if (!ingredient) {
        notFound();
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyPrices = ingredient.prices.filter(
        (p) => p.recordedAt >= startOfMonth
    );

    let averagePrice = null;
    let lowestMonthlyPrice = null;

    if (monthlyPrices.length > 0) {
        const sum = monthlyPrices.reduce((acc, p) => acc + p.price, 0);
        averagePrice = Math.round(sum / monthlyPrices.length);
        lowestMonthlyPrice = Math.min(
            ...monthlyPrices.map((p) => p.price)
        );
    }

    // @ts-ignore
    const monthlyUsage = ingredient.monthlyUsage ?? 10;

    let monthlySavings = null;

    if (averagePrice && lowestMonthlyPrice) {
        monthlySavings = (averagePrice - lowestMonthlyPrice) * monthlyUsage;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/" className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        {ingredient.name}
                        <span className="ml-2 text-base font-normal text-gray-500">({ingredient.unit})</span>
                    </h1>
                </div>

                {/* 월 사용량 설정 폼 */}
                <form
                    action={async (formData) => {
                        "use server";
                        const usage = parseInt(formData.get("usage") as string);
                        await updateIngredientUsage(ingredient.id, usage);
                    }}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm"
                >
                    <label className="text-xs font-semibold text-gray-500 pl-2">월 사용:</label>
                    <input
                        name="usage"
                        type="number"
                        defaultValue={monthlyUsage}
                        className="w-16 rounded border-none bg-gray-50 py-1 text-center text-sm font-bold text-gray-900 focus:ring-0"
                    />
                    <span className="text-xs text-gray-500 pr-1">{ingredient.unit}</span>
                    <button type="submit" className="rounded-md bg-gray-900 p-1.5 text-white hover:bg-gray-700">
                        <Save className="h-3 w-3" />
                    </button>
                </form>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 왼쪽: 가격 정보 및 절감액 */}
                <div className="space-y-6">
                    {/* 최저가 카드 */}
                    {lowestPrice ? (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                <TrendingDown className="h-4 w-4 text-green-600" />
                                현재 최저가 확인
                            </h3>
                            <div className="mt-4">
                                <div className="text-3xl font-bold text-gray-900">
                                    {lowestPrice.price.toLocaleString()}원
                                    <span className="text-lg text-gray-400 font-normal ml-1">/{lowestPrice.unit}</span>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                        최저가
                                    </span>
                                    <span>출처: <strong>{lowestPrice.source}</strong></span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 bg-gray-50">
                            아직 등록된 가격 정보가 없습니다.
                        </div>
                    )}

                    {/* 절감액 카드 */}
                    {monthlySavings !== null && monthlySavings > 0 && (
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-6 text-white shadow-md">
                            <div className="relative z-10">
                                <h3 className="text-sm font-medium text-cyan-100">이번 달 예상 절감액</h3>
                                <div className="mt-2 text-3xl font-bold">
                                    ₩{monthlySavings.toLocaleString()}
                                </div>
                                <p className="mt-1 text-xs text-cyan-100 opacity-80">
                                    (평균가 대비, 월 {monthlyUsage}{ingredient.unit} 사용 기준)
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 가격 추가 폼 (Client Component) */}
                    <AddPriceForm ingredientId={ingredient.id} unit={ingredient.unit} />
                </div>

                {/* 오른쪽: 가격 비교 테이블 */}
                <div>
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                        <Clock className="h-5 w-5 text-gray-500" />
                        가격 변동 기록
                    </h3>

                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        {ingredient.prices.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500">
                                아직 기록된 가격이 없습니다.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                                        <tr>
                                            <th className="px-6 py-4">출처</th>
                                            <th className="px-6 py-4">가격</th>
                                            <th className="px-6 py-4 text-right">기록일</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {ingredient.prices.map((p) => {
                                            const isLowest = p.id === lowestPrice?.id;
                                            return (
                                                <tr key={p.id} className={`hover:bg-gray-50 ${isLowest ? "bg-green-50/50" : ""}`}>
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {p.source}
                                                        {isLowest && <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">최저가</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">
                                                        {p.price.toLocaleString()}원
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-400">
                                                        {p.recordedAt.toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
