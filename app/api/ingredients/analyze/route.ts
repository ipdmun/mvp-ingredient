import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getMarketAnalysis, generateBusinessReport } from "@/app/lib/naver";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
        return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    try {
        const targetDate = new Date(dateStr);
        const nextDate = new Date(targetDate);
        nextDate.setDate(targetDate.getDate() + 1);

        // Fetch all prices recorded on that day for this user
        const prices = await prisma.ingredientPrice.findMany({
            where: {
                recordedAt: {
                    gte: targetDate,
                    lt: nextDate,
                },
                ingredient: {
                    userId: (session.user as any).id,
                },
                type: "PURCHASE",
            },
            include: {
                ingredient: true,
            },
        });

        if (prices.length === 0) {
            return NextResponse.json({
                report: ["지정된 날짜에 기록된 구매 내역이 없습니다."],
                items: []
            });
        }

        // Process items for analysis
        const processedItems = await Promise.all(prices.map(async (p) => {
            const amount = p.amount || 1;
            const totalPrice = p.totalPrice || (p.price * amount);

            // Re-fetch market analysis for fresh reporting if needed, 
            // but for speed we can try to use stored marketData if session is recent.
            // Let's re-fetch for accuracy as requested by "on-demand analysis" context.
            let marketAnalysis = p.marketData as any;
            if (!marketAnalysis) {
                try {
                    marketAnalysis = await getMarketAnalysis(p.ingredient.name, totalPrice, p.unit, amount);
                } catch (e) {
                    console.error("Analysis failed during on-demand scan", e);
                }
            }

            return {
                name: p.ingredient.name,
                price: totalPrice,
                amount: amount,
                unit: p.unit,
                marketAnalysis
            };
        }));

        const report = generateBusinessReport(processedItems);

        return NextResponse.json({
            date: dateStr,
            report,
            itemCount: prices.length,
            items: processedItems
        });

    } catch (error) {
        console.error("On-demand analysis error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
