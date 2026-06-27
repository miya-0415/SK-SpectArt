'use client';

import { useState, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, displayName || undefined);
      router.push("/login"); // 登録成功 → ログイン画面へ遷移
    } catch (err) {
      setError("アカウントの作成に失敗しました。もう一度お試しください。");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* カード背景の装飾アート */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl opacity-20 pointer-events-none">
        <svg
          viewBox="0 0 400 560"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <circle cx="80"  cy="160" r="140" fill="rgba(165,146,29,0.3)" />
          <circle cx="320" cy="100" r="110" fill="rgba(79,195,247,0.2)" />
          <circle cx="200" cy="480" r="100" fill="rgba(206,147,216,0.2)" />
          <path
            d="M20,280 Q100,210 200,280 T380,280"
            stroke="rgba(165,146,29,0.4)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M20,330 Q100,260 200,330 T380,330"
            stroke="rgba(165,146,29,0.25)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>

      {/* カード本体 */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg px-8 py-10 flex flex-col items-center gap-5">
        {/* ロゴ */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl overflow-hidden shadow-md w-16 h-16 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="SpectArt logo"
              width={64}
              height={64}
              className="object-cover"
              priority
            />
          </div>
          <p className="text-center text-sm font-medium" style={{ color: "#A5921D" }}>
            新しいアカウントを作成
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          {/* 表示名（任意） */}
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="表示名（任意）"
            maxLength={50}
            className="w-full rounded-xl border px-4 py-3 text-sm bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#A5921D]/40 transition"
            style={{ borderColor: "#A5921D" }}
          />

          {/* メールアドレス */}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            required
            className="w-full rounded-xl border px-4 py-3 text-sm bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#A5921D]/40 transition"
            style={{ borderColor: "#A5921D" }}
          />

          {/* パスワード */}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード（8文字以上）"
            required
            minLength={8}
            className="w-full rounded-xl border px-4 py-3 text-sm bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#A5921D]/40 transition"
            style={{ borderColor: "#A5921D" }}
          />

          {/* パスワード確認 */}
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="パスワード（確認）"
            required
            className="w-full rounded-xl border px-4 py-3 text-sm bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#A5921D]/40 transition"
            style={{ borderColor: "#A5921D" }}
          />

          {/* パスワード強度インジケーター */}
          {password.length > 0 && (
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="h-1 flex-1 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor:
                      password.length >= level * 3
                        ? level <= 1
                          ? "#ef4444"
                          : level === 2
                          ? "#f97316"
                          : level === 3
                          ? "#eab308"
                          : "#22c55e"
                        : "#e5e7eb",
                  }}
                />
              ))}
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}

          {/* 登録ボタン */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 active:opacity-80 disabled:opacity-60"
            style={{ backgroundColor: "#A5921D" }}
          >
            {isSubmitting ? "作成中..." : "アカウントを作成"}
          </button>
        </form>

        {/* 区切り */}
        <hr className="w-full border-gray-200" />

        {/* ログインへ戻る */}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full rounded-xl border py-3 text-sm font-medium text-gray-800 bg-white transition hover:bg-gray-50 active:bg-gray-100"
          style={{ borderColor: "#A5921D" }}
        >
          すでにアカウントをお持ちの方
        </button>
      </div>
    </div>
  );
}
