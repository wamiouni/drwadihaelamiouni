import { cookies } from "next/headers";
import { createHash } from "node:crypto";

const COOKIE = "wadiha_admin";

function token(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(`wadiha:${pw}`).digest("hex");
}

export async function isAuthed(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const c = await cookies();
  return c.get(COOKIE)?.value === token();
}

export async function signIn(password: string): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return false;
  }
  const c = await cookies();
  c.set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return true;
}

export async function signOut(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}
