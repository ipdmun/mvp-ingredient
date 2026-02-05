import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import RecipeListContainer from "@/app/components/RecipeListContainer";
import { ChefHat } from "lucide-react";

export default async function RecipeListPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/login");
    }

    return (
        <main className="min-h-screen bg-gray-50/50 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/60 bg-white/80 px-4 backdrop-blur-md">
                <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <ChefHat className="h-6 w-6 text-orange-500" />
                    메뉴 관리
                </h1>
            </div>

            <div className="p-4">
                <RecipeListContainer />
            </div>
        </main>
    );
}
