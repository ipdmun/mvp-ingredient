'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center space-y-4 border border-red-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">문제가 발생했습니다</h2>

                {/* Debug Info Section */}
                <div className="bg-gray-100 p-4 rounded text-left overflow-auto max-h-60 text-xs font-mono text-red-600">
                    <p className="font-bold border-b border-gray-300 pb-2 mb-2">DEBUG INFO:</p>
                    <p className="whitespace-pre-wrap break-all">{error.message}</p>
                    {error.digest && <p className="mt-2 text-gray-500">Digest: {error.digest}</p>}
                </div>

                <p className="text-gray-500">서버에서 데이터를 처리하는 중 예상치 못한 오류가 발생했습니다.</p>
                <button
                    onClick={() => reset()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    다시 시도하기
                </button>
            </div>
        </div>
    );
}
