"use client";

import { AlertTriangle, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function EnvDiagnostic({
    hasDbUrl,
    hasAuthSecret,
    dbError
}: {
    hasDbUrl: boolean;
    hasAuthSecret: boolean;
    dbError?: string;
}) {
    const [copied, setCopied] = useState("");

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(""), 2000);
    };

    if (hasDbUrl && hasAuthSecret && !dbError) return null;

    return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm mb-6">
            <div className="flex items-center gap-3 text-red-700 mb-4">
                <AlertTriangle className="h-8 w-8" />
                <div>
                    <h3 className="text-lg font-bold">시스템 구성 오류 (배포 환경)</h3>
                    <p className="text-sm font-medium opacity-90">Vercel 설정에서 환경 변수가 누락되었거나 DB 연결에 실패했습니다.</p>
                </div>
            </div>

            <div className="space-y-4 bg-white p-4 rounded-lg border border-red-100">
                <div className="grid gap-2">
                    <StatusItem label="DATABASE_URL" isValid={hasDbUrl} />
                    <StatusItem label="NEXTAUTH_SECRET" isValid={hasAuthSecret} />
                    <StatusItem label="DB Connection" isValid={!dbError} errorMessage={dbError} />
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-2 font-bold">💡 해결 방법: Vercel 대시보드 → Settings → Environment Variables에 아래 값을 추가하세요.</p>
                    <div className="space-y-3">
                        <EnvRow
                            label="DATABASE_URL"
                            value="postgres://bec1a7b02328c70c4b946d45fa804f27a2e075d4e30aeb9119e9a158833acb80:sk_8iy3JzkcJ8SINeR9MsnUB@db.prisma.io:5432/postgres?sslmode=require"
                            copied={copied}
                            onCopy={handleCopy}
                        />
                        <EnvRow
                            label="NEXTAUTH_SECRET"
                            value="mvp-ingredient-secret-key-change-me"
                            copied={copied}
                            onCopy={handleCopy}
                        />
                        <EnvRow
                            label="NEXTAUTH_URL"
                            value="https://mvp-ingredient.vercel.app"
                            copied={copied}
                            onCopy={handleCopy}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusItem({ label, isValid, errorMessage }: { label: string, isValid: boolean, errorMessage?: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{label}</span>
            <div className="flex items-center gap-2">
                {isValid ? (
                    <span className="flex items-center gap-1 text-green-600 font-bold">
                        <Check className="h-4 w-4" /> 설정됨
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-red-600 font-bold">
                        <AlertTriangle className="h-4 w-4" /> {errorMessage || "누락됨 / 실패"}
                    </span>
                )}
            </div>
        </div>
    );
}

function EnvRow({ label, value, copied, onCopy }: { label: string, value: string, copied: string, onCopy: (v: string, l: string) => void }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 overflow-hidden rounded-md bg-gray-100 p-2 text-xs font-mono text-gray-800 break-all border border-gray-200">
                <span className="text-blue-600 font-bold mr-2">{label}=</span>
                {value}
            </div>
            <button
                onClick={() => onCopy(value, label)}
                className="flex items-center justify-center p-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                title="복사하기"
            >
                {copied === label ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
            </button>
        </div>
    );
}
