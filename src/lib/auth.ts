import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "progresso_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "progresso-development-secret-change-this",
);

export type Session = {
  userId: string;
  username: string;
};

type JwtPayload = Session & {
  exp?: number;
  iat?: number;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(session: Session) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<JwtPayload>(token, secretKey);
    const userId = verified.payload.userId;
    const username = verified.payload.username;

    if (
      typeof userId !== "string"
      || !/^[0-9a-f]{24}$/i.test(userId)
      || typeof username !== "string"
      || username.length === 0
    ) {
      return null;
    }

    return {
      userId,
      username,
    };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/auth");
  }

  return session;
}
