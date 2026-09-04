import { cookies } from "next/headers";
import { hmac, safeEqual } from "@/lib/crypto";
import { cryptoEnv } from "@/config/env";

// Signed (HMAC) session cookie carrying only the user's identity. Tokens and
// secrets never go in the cookie — they live encrypted in the database.

const COOKIE = "it_session";
const MAX_AGE = 60 * 60 * 24 * 7;

export type Session = {
  uid: string;
  sub: string;
  email: string;
  studentId?: string;
};

function sign(payload: string): string {
  return hmac(payload, cryptoEnv().SESSION_SECRET);
}

function encode(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(value: string): Session | null {
  const [payload, mac] = value.split(".");
  if (!payload || !mac) return null;
  if (!safeEqual(mac, sign(payload))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  return raw ? decode(raw) : null;
}

export async function setSession(session: Session): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, encode(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}
