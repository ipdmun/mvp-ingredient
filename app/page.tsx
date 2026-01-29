import { prisma } from "@/app/lib/prisma";
import Link from "next/link";
import { createIngredient } from "./ingredients/actions";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Plus, Package } from "lucide-react";
import IngredientList from "./components/IngredientList";
import GlobalCameraFab from "./components/GlobalCameraFab";

export const runtime = "nodejs";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const ingredients = await prisma.ingredient.findMany({
    where: {
      userId: session.user.id as string,
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
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">식자재 목록</h1>
        <p className="text-gray-500">관리 중인 식자재를 추가하고 확인하세요.</p>
      </div>

      {/* 입력 폼 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">새 재료 추가하기</h2>
        <form action={createIngredient} className="flex gap-3">
          <div className="flex-1">
            <input
              name="name"
              placeholder="재료 이름 (예: 양파)"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="w-24">
            <input
              name="unit"
              placeholder="단위 (kg)"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            추가
          </button>
        </form>
      </div>

      {/* 재료 리스트 (Client Component) */}
      {ingredients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <div className="rounded-full bg-gray-100 p-3">
            <Package className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">등록된 재료가 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">위 폼을 사용하여 첫 번째 재료를 추가해보세요.</p>
        </div>
      ) : (
        <IngredientList initialIngredients={ingredients} />
      )}
      <GlobalCameraFab ingredients={ingredients} />
    </div>
  );
}
