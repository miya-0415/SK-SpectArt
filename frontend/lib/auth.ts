// lib/auth.ts
// JWT の署名・検証とセッション Cookie の定数を管理するユーティリティ

import jwt from "jsonwebtoken";

/** HttpOnly Cookie の名前 */
export const COOKIE_NAME = "spectart_session";

/** Cookie の有効期限（秒）: 7日間 */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

interface TokenPayload {
  userId: string;
}

/**
 * ユーザー ID を含む JWT を署名して返す
 */
export function signToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

/**
 * JWT を検証してペイロードを返す。
 * 検証失敗時は null を返す（例外を外に漏らさない）
 */
export function verifyToken(token: string): TokenPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}
