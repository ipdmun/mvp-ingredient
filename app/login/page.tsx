"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
    return (
        <main style={{ padding: 40, textAlign: "center" }}>
            <h1>로그인</h1>
            <p style={{ marginBottom: 20 }}>서비스를 이용하려면 로그인이 필요합니다.</p>
            <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                style={{
                    padding: "10px 20px",
                    fontSize: 16,
                    backgroundColor: "#4285F4",
                    color: "white",
                    border: "none",
                    borderRadius: 5,
                    cursor: "pointer"
                }}
            >
                Google로 로그인
            </button>
        </main>
    );
}
