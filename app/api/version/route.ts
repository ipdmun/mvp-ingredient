import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Try a simple query to check DB connection
        const count = await prisma.ingredient.count();
        return NextResponse.json({
            version: '0.1.13',
            dbStatus: 'Connected',
            ingredientCount: count,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({
            version: '0.1.13',
            dbStatus: 'Failed',
            error: error.message,
            env: {
                hasDbUrl: !!process.env.DATABASE_URL,
                nodeEnv: process.env.NODE_ENV
            },
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
