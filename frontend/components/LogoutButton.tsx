'use client';
// components/LogoutButton.tsx
// ログアウト API を呼び出し、Cookie を削除して /login へリダイレクトする

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ネットワークエラーでも画面遷移は実行する
    } finally {
      router.push("/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="w-full rounded-xl border py-3 text-sm font-medium text-gray-800 bg-white transition hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60"
      style={{ borderColor: "#A5921D" }}
    >
      {isLoading ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}

