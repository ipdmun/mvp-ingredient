import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";
import { prisma } from "./lib/prisma";
import Link from "next/link";
import { Bell, LayoutDashboard, List, ShieldCheck } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "식자재 관리 Pro",
  description: "사장님을 위한 스마트한 식자재 비용 관리",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  let unreadCount = 0;

  try {
    session = await getServerSession(authOptions);

    if (session?.user) {
      unreadCount = await (prisma as any).notification.count({
        where: {
          userId: (session.user as any).id,
          isRead: false,
        },
      });
    }
  } catch (error) {
    console.error("Critical Layout Error (Session/Prisma):", error);
    // 앱 전체 중단(Digest error)을 방지하기 위해 빈 상태로 진행
  }

  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-blue-600 hover:opacity-80">
                🥗 성공식당
                <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full border border-red-200 align-top">v0.1.7</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-all hover:scale-105 active:scale-95">
                  <List className="h-4 w-4" />
                  목록
                </Link>
                <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-all hover:scale-105 active:scale-95">
                  <LayoutDashboard className="h-4 w-4" />
                  대시보드
                </Link>
                <Link href="/admin" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-all hover:scale-105 active:scale-95">
                  <ShieldCheck className="h-4 w-4" />
                  관리자
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {session?.user && (
                <Link href="/notifications" className="relative group p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <Bell className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}
              {session?.user ? (
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                  {session.user.name?.[0] || "U"}
                </div>
              ) : (
                <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
                  로그인
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile Menu (Simple) */}
        <div className="md:hidden flex justify-around border-b border-gray-200 bg-white py-2">
          <Link href="/" className="text-sm font-medium text-gray-600 p-2 transition-transform hover:scale-105 active:scale-95">목록</Link>
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 p-2 transition-transform hover:scale-105 active:scale-95">대시보드</Link>
          <Link href="/admin" className="text-sm font-medium text-gray-600 p-2 transition-transform hover:scale-105 active:scale-95">관리자</Link>
        </div>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
