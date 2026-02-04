
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Package, FileText, ArrowLeft } from "lucide-react";

export const runtime = "nodejs";

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.id) {
        redirect("/login");
    }

    const userCount = await prisma.user.count();
    const ingredientCount = await prisma.ingredient.count();
    const priceCount = await prisma.ingredientPrice.count();

    const users = await prisma.user.findMany({
        include: {
            _count: {
                select: { ingredients: true },
            },
        },
        orderBy: {
            id: "asc"
        },
        take: 20,
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">관리자 대시보드</h1>
                    <p className="text-sm text-gray-500">
                        전체 시스템 현황 및 사용자 활동을 모니터링합니다.
                    </p>
                </div>
                <Link href="/dashboard" className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                    <ArrowLeft className="h-4 w-4" /> 앱으로 돌아가기
                </Link>
            </div>

            {/* 통계 요약 카드 */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <StatCard
                    title="총 가입자"
                    value={`${userCount}명`}
                    icon={<Users className="h-6 w-6 text-blue-600" />}
                    color="border-l-blue-500"
                />
                <StatCard
                    title="등록된 식자재"
                    value={`${ingredientCount}개`}
                    icon={<Package className="h-6 w-6 text-green-600" />}
                    color="border-l-green-500"
                />
                <StatCard
                    title="가격 기록"
                    value={`${priceCount}건`}
                    icon={<FileText className="h-6 w-6 text-yellow-600" />}
                    color="border-l-yellow-500"
                />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="font-semibold text-gray-900">최근 사용자 활동</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-3">유저 이름</th>
                                <th className="px-6 py-3">이메일</th>
                                <th className="px-6 py-3 text-center">등록 재료 수</th>
                                <th className="px-6 py-3 text-right">ID (Partial)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {user.name?.[0] || "U"}
                                            </div>
                                            {user.name || "이름 없음"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{user.email || "이메일 없음"}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                            {user._count.ingredients}개
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">
                                        {user.id.substring(0, 8)}...
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
    return (
        <div className={`overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 border-l-4 ${color}`}>
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        {icon}
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
                            <dd>
                                <div className="text-2xl font-bold text-gray-900">{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
