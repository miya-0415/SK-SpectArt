// app/dashboard/page.tsx
// Server Component: Cookie を直接読み取ってサーバー側で認証チェックを行う

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) redirect("/login");

  const payload = verifyToken(token);
  if (!payload) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, displayName: true },
  });

  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-[#D9D9D9] flex flex-col items-center justify-center gap-6 px-4">
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg px-10 py-10 flex flex-col items-center gap-4 w-full max-w-sm">
        <h1 className="text-lg font-bold" style={{ color: "#A5921D" }}>
          ダッシュボード
        </h1>

        <p className="text-sm text-gray-600 text-center">
          ようこそ、
          <span className="font-medium">
            {user.displayName ?? user.email}
          </span>{" "}
          さん
        </p>

        {/* TODO: メイン機能の UI をここに追加 */}
        <div className="w-full border rounded-xl border-dashed border-gray-300 py-8 flex items-center justify-center text-gray-400 text-sm">
          作品一覧・編集エリア（準備中）
        </div>

        {/* クライアントコンポーネント: ログアウトボタン */}
        <LogoutButton />
      </div>
    </main>
  );
}

