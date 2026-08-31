// app/api/artworks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getCurrentUser(req: NextRequest) {
  const baseUrl = req.nextUrl.origin;
  const cookieHeader = req.headers.get("cookie") ?? "";
  try {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null; // ← { user: { id, email, ... } } で包まれている
  } catch {
    return null;
  }
}

// GET /api/artworks → ログインユーザーのアートワーク一覧
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artworks = await prisma.artwork.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json(artworks);
}

// POST /api/artworks → 新しいアートワークを保存
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, imageUrl } = await req.json();
  if (!title || !imageUrl) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const artwork = await prisma.artwork.create({
    data: { title, imageUrl, userId: user.id },
  });

  return NextResponse.json({
    id: artwork.id,
    title: artwork.title,
    imageUrl: artwork.imageUrl,
    createdAt: artwork.createdAt,
  });
}