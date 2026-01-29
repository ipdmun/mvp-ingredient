import { prisma } from "@/app/lib/prisma";
import Link from "next/link";
import { createIngredient, deleteIngredient } from "./actions";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import IngredientList from "../components/IngredientList";

export const runtime = "nodejs";

export default async function IngredientsPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        redirect("/login");
    }

    const ingredients = await prisma.ingredient.findMany({
        where: {
            // @ts-ignore
            userId: session.user.id,
        },
        include: {
            prices: {
                orderBy: { recordedAt: "desc" },
                take: 50,
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">식자재 관리</h1>
                <p className="text-gray-500">관리 중인 식자재를 추가하고 확인하세요.</p>
            </div>

            {/* 입력 폼 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">새 재료 추가하기</h2>
                <form action={createIngredient} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <input
                            name="name"
                            placeholder="재료 이름 (예: 양파)"
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="w-full sm:w-24">
                        <input
                            name="unit"
                            placeholder="단위 (kg)"
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded-md bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
                    >
                        추가
                    </button>
                </form>
            </div>

            {/* 재료 리스트 (Analysis Components) */}
            {ingredients.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
                    <p className="text-gray-500 italic">아직 등록된 식자재가 없습니다.</p>
                </div>
            ) : (
                <IngredientList initialIngredients={ingredients as any} />
            )}
        </div>
    );
}
