'use client';

import { useState, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError("ログインに失敗しました。メールアドレスまたはパスワードを確認してください。");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = () => {
    router.push("/register");
  };

  const handleForgotPassword = () => {
    // TODO: パスワードリセットページへの遷移
    console.log("forgot password", { email });
    router.push("/forgot-password");
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* 背景の抽象アート（薄い装飾） */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl opacity-20 pointer-events-none">
        <svg
          viewBox="0 0 400 500"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <circle cx="80"  cy="160" r="140" fill="rgba(165,146,29,0.3)" />
          <circle cx="320" cy="100" r="110" fill="rgba(79,195,247,0.2)" />
          <circle cx="200" cy="420" r="100" fill="rgba(206,147,216,0.2)" />
          <path
            d="M20,250 Q100,180 200,250 T380,250"
            stroke="rgba(165,146,29,0.4)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M20,300 Q100,230 200,300 T380,300"
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
            作品を保存・編集するにはログインが必要です
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
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
            placeholder="パスワード"
            required
            className="w-full rounded-xl border px-4 py-3 text-sm bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#A5921D]/40 transition"
            style={{ borderColor: "#A5921D" }}
          />

          {/* エラー表示 */}
          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 active:opacity-80 disabled:opacity-60"
            style={{ backgroundColor: "#A5921D" }}
          >
            ログイン
          </button>

          {/* パスワードを忘れた場合 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-gray-500 hover:text-gray-700 transition underline-offset-2 hover:underline"
            >
              パスワードを忘れた場合
            </button>
          </div>
        </form>

        {/* 区切り */}
        <hr className="w-full border-gray-200" />

        {/* 新規登録ボタン */}
        <button
          type="button"
          onClick={handleRegister}
          disabled={isSubmitting}
          className="w-full rounded-xl border py-3 text-sm font-medium text-gray-800 bg-white transition hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60"
          style={{ borderColor: "#A5921D" }}
        >
          新しいアカウントを作成
        </button>
      </div>
    </div>
  );
}
