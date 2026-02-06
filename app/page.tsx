import { prisma } from "@/app/lib/prisma";
import Link from "next/link";
import { createIngredient } from "./ingredients/actions";
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";
import { redirect } from "next/navigation";
import { Plus, Package, ChefHat } from "lucide-react";
import IngredientList from "./components/IngredientList";
import GlobalCameraFab from "./components/GlobalCameraFab";
import AddIngredientModal from "./components/AddIngredientModal";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    redirect("/login");
  }
  const userId = (session.user as any).id;
  // Ensure userId is clean
  const cleanUserId = userId.trim();

  // FIX: Prisma findMany(where: { userId }) is failing in production.
  // Bypass: Fetch IDs via Raw SQL first, then fetch details via Prisma (to keep relations).
  let ingredients: any[] = [];
  try {
    ingredients = await prisma.ingredient.findMany({
      where: {
        userId: cleanUserId // Use cleaned ID
      },
      include: {
        prices: {
          orderBy: { recordedAt: "desc" },
          take: 50,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Home Page Data Fetch Error:", error);
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            식자재 목록
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-200">v0.1.9</span>
          </h1>
          <p className="mt-1 text-gray-500">관리 중인 식자재를 추가하고 확인하세요.</p>
        </div>
        <Link
          href="/recipes"
          className="flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-600 transition-all hover:bg-orange-100 active:scale-95 shadow-sm border border-orange-100/50"
        >
          <ChefHat className="h-5 w-5" />
          메뉴 관리
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <AddIngredientModal />
      </div>

      {/* 재료 리스트 (Client Component) */}
      {
        ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
            <div className="rounded-full bg-gray-100 p-3">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-gray-900">등록된 재료가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">위 폼을 사용하여 첫 번째 재료를 추가해보세요.</p>
          </div>
        ) : (
          <IngredientList initialIngredients={ingredients} />
        )
      }
      <GlobalCameraFab ingredients={ingredients} />
    </div >
  );
}
