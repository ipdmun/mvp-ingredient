import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    let count = -1;
    let dbStatus = 'Unknown';
    let errorMsg = null;

    try {
        count = await prisma.ingredient.count();
        dbStatus = 'Connected';
    } catch (error: any) {
        dbStatus = 'Failed';
        errorMsg = error.message;
    }

    return NextResponse.json({
        version: '0.1.16',
        dbStatus,
        env: {
            hasDbUrl: !!process.env.DATABASE_URL,
            hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET, // CRITICAL CHECK
            nodeEnv: process.env.NODE_ENV
        },
        ingredientCount: count,
        error: errorMsg,
        timestamp: new Date().toISOString()
    });
}
