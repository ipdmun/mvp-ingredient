
import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import { createIngredientPrice, updateIngredientUsage } from "../actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import Link from "next/link";
import { ArrowLeft, Save, Plus, TrendingDown, Clock, CreditCard } from "lucide-react";
import AddPriceForm from "../components/AddPriceForm";
import IngredientPriceSummary from "../../components/IngredientPriceSummary";

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

    const { getIngredientIcon } = await import("@/app/lib/utils");

    // @ts-ignore
    const monthlyUsage = ingredient.monthlyUsage ?? 10;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/" className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </Link>
                <div className="flex-1 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-2xl shadow-inner border border-blue-100/50 overflow-hidden">
                        {getIngredientIcon(ingredient.name).startsWith("/") ? (
                            <img src={getIngredientIcon(ingredient.name)} alt={ingredient.name} className="h-full w-full object-contain p-1 mix-blend-multiply" />
                        ) : (
                            getIngredientIcon(ingredient.name)
                        )}
                    </div>
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
                    {/* 가격 분석 Summary (Client Component) */}
                    <div className="block">
                        {/* @ts-ignore */}
                        <IngredientPriceSummary
                            prices={ingredient.prices}
                            unit={ingredient.unit}
                            lowestPrice={lowestPrice ? { price: lowestPrice.price, source: lowestPrice.source } : null}
                        />
                    </div>

                    {/* 가격 추가 폼 (Client Component) */}
                    <AddPriceForm ingredientId={ingredient.id} unit={ingredient.unit} />
                </div>

                {/* 오른쪽: 가격 비교 테이블 */}
                <div>
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                        <Clock className="h-5 w-5 text-gray-500" />
                        구매 내역
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
                                            <th className="px-6 py-4">구매 정보 (총액)</th>
                                            <th className="px-6 py-4">단가 환산</th>
                                            <th className="px-6 py-4 text-right">날짜</th>
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
                                                    <td className="px-6 py-4 text-gray-700">
                                                        {p.totalPrice ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">{p.totalPrice.toLocaleString()}원/{p.amount}{p.unit}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-blue-600 font-bold">
                                                        {p.price.toLocaleString()}원 <span className="text-xs font-normal text-gray-400">/{p.unit}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-400 text-xs">
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
