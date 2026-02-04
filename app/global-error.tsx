'use client'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body className="flex min-h-screen flex-col items-center justify-center space-y-4 text-center p-4">
                <div className="rounded-full bg-red-100 p-3">
                    <svg
                        className="h-8 w-8 text-red-600"
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
                    <h2 className="text-2xl font-bold text-gray-900">심각한 오류가 발생했습니다</h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                        애플리케이션 전체가 일시적으로 중단되었습니다. 새로고침을 시도해주세요.
                        {error.digest && <span className="block mt-1 font-mono text-sm text-gray-400">ID: {error.digest}</span>}
                    </p>
                </div>
                <button
                    onClick={() => reset()}
                    className="rounded-md bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
                >
                    새로고침 및 다시 시도
                </button>
            </body>
        </html>
    )
}
