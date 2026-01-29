
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export default async function NotificationsPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        redirect("/login");
    }

    // 1. 읽지 않은 알림을 포함한 최근 알림 조회
    const notifications = await prisma.notification.findMany({
        where: {
            userId: session.user.id,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    // 2. 이 페이지에 들어오면 모두 읽음 처리 (간단한 UX)
    if (notifications.some(n => !n.isRead)) {
        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false,
            },
            data: { isRead: true },
        });
        revalidatePath("/notifications");
    }

    return (
        <main style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h1>알림 목록</h1>
                <Link href="/dashboard" style={{ textDecoration: "none", color: "#555" }}>
                    ← 대시보드로
                </Link>
            </div>

            {notifications.length === 0 ? (
                <p>새로운 알림이 없습니다.</p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {notifications.map((n) => (
                        <li
                            key={n.id}
                            style={{
                                padding: "15px",
                                border: "1px solid #eee",
                                borderRadius: "8px",
                                marginBottom: "10px",
                                background: n.isRead ? "#fff" : "#eff6ff", // 읽지 않음: 옅은 파랑
                                borderLeft: n.isRead ? "1px solid #eee" : "4px solid #3b82f6",
                            }}
                        >
                            <div style={{ marginBottom: "5px", fontSize: "16px" }}>
                                {n.message}
                            </div>
                            <div style={{ fontSize: "12px", color: "#888" }}>
                                {n.createdAt.toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
