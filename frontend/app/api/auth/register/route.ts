// app/api/auth/register/route.ts
// POST /api/auth/register
// 新規ユーザー登録。パスワードを bcryptjs でハッシュ化して MySQL に保存する。

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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

  const { email, password, displayName } = body as {
    email?: string;
    password?: string;
    displayName?: string;
  };

  // ── バリデーション ──────────────────────────────────────────────
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { error: "有効なメールアドレスを入力してください" },
      { status: 400 }
    );
  }
  if (!password || typeof password !== "string") {
    return NextResponse.json(
      { error: "パスワードは必須です" },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "パスワードは8文字以上で入力してください" },
      { status: 400 }
    );
  }

  // ── 重複チェック ────────────────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "このメールアドレスは既に使用されています" },
      { status: 409 }
    );
  }

  // ── パスワードハッシュ化（コスト係数 12） ──────────────────────
  const hashedPassword = await bcrypt.hash(password, 12);

  // ── ユーザー作成 ────────────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      displayName: displayName?.trim() || null,
    },
    select: { id: true, email: true, displayName: true },
  });

  return NextResponse.json(user, { status: 201 });
}
