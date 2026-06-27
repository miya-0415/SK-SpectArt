// app/api/auth/logout/route.ts
// POST /api/auth/logout
// HttpOnly Cookie を即時削除してセッションを無効化する。

import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ message: "ログアウトしました" });

  // maxAge を 0 に設定することで Cookie を即時削除
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return res;
}
