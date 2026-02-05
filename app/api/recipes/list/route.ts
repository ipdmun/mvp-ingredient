import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // @ts-ignore
        const userId = session.user.id;

        // Use fallback if ID is missing (double check)
        if (!userId && session.user.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true }
            });
            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // @ts-ignore
        const recipes = await prisma.recipe.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: { ingredients: true }
        });

        // Manual sanitization just in case, though NextResponse handles JSON well
        const sanitized = JSON.parse(JSON.stringify(recipes));

        return NextResponse.json({ recipes: sanitized });
    } catch (error: any) {
        console.error("[API_RECIPES_LIST] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
