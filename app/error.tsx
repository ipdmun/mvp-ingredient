'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // 에러 로깅 서비스가 있다면 여기서 호출
        console.error('App Error:', error)
    }, [error])

    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-red-100 p-3">
                <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900">문제가 발생했습니다</h2>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                    서버에서 데이터를 처리하는 중 예상치 못한 오류가 발생했습니다.
                    {error.digest && <span className="block mt-1 font-mono text-xs text-gray-400">ID: {error.digest}</span>}
                </p>
            </div>
            <button
                onClick={() => reset()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
                다시 시도하기
            </button>
        </div>
    )
}
