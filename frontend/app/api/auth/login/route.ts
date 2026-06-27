// app/api/auth/login/route.ts
// POST /api/auth/login
// メールアドレス・パスワードを照合し、認証成功時に HttpOnly Cookie を発行する。

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません" },
      { status: 400 }
    );
  }

  const { email, password } = body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "メールアドレスとパスワードは必須です" },
      { status: 400 }
    );
  }

  // ── ユーザー検索 ────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // タイミング攻撃対策: ユーザーが存在しない場合もハッシュ比較を実行する
  const dummyHash =
    "$2a$12$invalidhashvalueusedfortimingattackprevention00000000000";
  const isValid = await bcrypt.compare(
    password,
    user?.password ?? dummyHash
  );

  if (!user || !isValid) {
    return NextResponse.json(
      { error: "メールアドレスまたはパスワードが正しくありません" },
      { status: 401 }
    );
  }

  // ── JWT 署名 & HttpOnly Cookie 発行 ────────────────────────────
  const token = signToken({ userId: user.id });

  const res = NextResponse.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  });

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return res;
}
