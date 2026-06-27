'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // すでにログイン済みならダッシュボードへ
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D9D9D9]">
        <span className="text-sm text-gray-500">読み込み中...</span>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-[#D9D9D9] overflow-hidden px-4">
      {/* 全体背景の装飾アート */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 800 600"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <circle cx="120"  cy="200" r="220" fill="rgba(165,146,29,0.06)" />
          <circle cx="700"  cy="400" r="180" fill="rgba(79,195,247,0.05)" />
          <circle cx="400"  cy="580" r="150" fill="rgba(206,147,216,0.05)" />
          <path
            d="M0,300 Q200,200 400,300 T800,300"
            stroke="rgba(165,146,29,0.12)"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M0,340 Q200,240 400,340 T800,340"
            stroke="rgba(165,146,29,0.08)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M0,260 Q200,160 400,260 T800,260"
            stroke="rgba(165,146,29,0.06)"
            strokeWidth="1.5"
            fill="none"
          />
          {[60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((x, i) => (
            <rect
              key={i}
              x={x}
              y={280 - (i % 3 === 0 ? 60 : i % 3 === 1 ? 40 : 20)}
              width="6"
              height={i % 3 === 0 ? 60 : i % 3 === 1 ? 40 : 20}
              rx="3"
              fill="rgba(165,146,29,0.08)"
            />
          ))}
          {[460, 490, 520, 550, 580, 610, 640, 670, 700, 730].map((x, i) => (
            <rect
              key={i}
              x={x}
              y={280 - (i % 3 === 0 ? 50 : i % 3 === 1 ? 30 : 15)}
              width="6"
              height={i % 3 === 0 ? 50 : i % 3 === 1 ? 30 : 15}
              rx="3"
              fill="rgba(165,146,29,0.07)"
            />
          ))}
        </svg>
      </div>

      {/* 新規登録カード */}
      <RegisterForm />

      {/* 下部フッターリンク */}
      <div className="mt-8 flex gap-8 text-xs text-gray-400">
        <button
          type="button"
          onClick={() => console.log("Download")}
          className="hover:text-gray-600 transition"
        >
          Download
        </button>
        <button
          type="button"
          onClick={() => console.log("Edit/Export")}
          className="hover:text-gray-600 transition"
        >
          Edit/Export
        </button>
      </div>
    </main>
  );
}
