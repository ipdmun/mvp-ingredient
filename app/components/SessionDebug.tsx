"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";

export default function SessionDebug({ session, dbStatus }: { session: any, dbStatus: any }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!session && !dbStatus) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white border-t border-gray-700 font-mono text-xs opacity-90">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-800 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-green-400" />
                    <span className="font-bold text-green-400">DEBUG CONSOLE</span>
                    <span className="text-gray-400">
                        (User: {session?.user?.id?.slice(0, 8)}... | DB: {dbStatus === "OK" ? "Connected" : "Error"})
                    </span>
                </div>
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>

            {isOpen && (
                <div className="p-4 space-y-4 max-h-[300px] overflow-auto border-t border-gray-700 bg-gray-950">
                    <div>
                        <h4 className="font-bold text-blue-400 mb-1">[Session Data]</h4>
                        <pre className="bg-gray-900 p-2 rounded text-gray-300 overflow-x-auto">
                            {JSON.stringify(session, null, 2)}
                        </pre>
                    </div>
                    <div>
                        <h4 className="font-bold text-yellow-400 mb-1">[DB Status]</h4>
                        <pre className="bg-gray-900 p-2 rounded text-gray-300 overflow-x-auto">
                            {JSON.stringify(dbStatus, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
