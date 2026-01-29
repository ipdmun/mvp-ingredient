import { prisma } from "@/app/lib/prisma";
import Link from "next/link";
import { createIngredient, deleteIngredient } from "./actions";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function IngredientsPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        redirect("/login");
    }

    const ingredients = await prisma.ingredient.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            prices: {
                orderBy: { recordedAt: "desc" },
                take: 50, // 최근 50개면 충분 (평균가 계산용)
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <main style={{ padding: 20 }}>
            <h1>Ingredients</h1>

            {/* 👇 추가 폼 */}
            <form action={createIngredient} style={{ marginBottom: 20 }}>
                <input
                    name="name"
                    placeholder="재료 이름 (예: 양파)"
                    required
                    style={{ marginRight: 10, padding: 5 }}
                />
                <input
                    name="unit"
                    placeholder="단위 (예: kg)"
                    required
                    style={{ marginRight: 10, padding: 5 }}
                />
                <button type="submit" style={{ padding: "5px 10px" }}>추가</button>
            </form>

            {ingredients.length === 0 && (
                <p>No ingredients yet.</p>
            )}

            <ul>
                {ingredients.map((item) => (
                    <li key={item.id} style={{ marginBottom: 8 }}>
                        <Link href={`/ingredients/${item.id}`}>
                            {item.name} ({item.unit})
                        </Link>

                        {/* 👇 삭제 버튼 */}
                        <form
                            action={async () => {
                                "use server";
                                await deleteIngredient(item.id);
                            }}
                            style={{ display: "inline", marginLeft: 10 }}
                        >
                            <button type="submit">삭제</button>
                        </form>
                    </li>
                ))}
            </ul>
        </main>
    );
}
