import { createCookieSessionStorage, redirect } from "react-router";
import type { AuthUser } from "~/types";

interface SessionData {
  user: AuthUser;
  oauth_state: string;
}

// --- Environment ---

function getEnv() {
  const AUTHENTIK_CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID;
  const AUTHENTIK_CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET;
  const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
  const AUTHENTIK_ISSUER =
    process.env.AUTHENTIK_ISSUER ||
    "https://auth.codepoet.site/application/o/sample-ssr";

  if (!AUTHENTIK_CLIENT_ID || !AUTHENTIK_CLIENT_SECRET) {
    throw new Error(
      "Missing AUTHENTIK_CLIENT_ID or AUTHENTIK_CLIENT_SECRET environment variables"
    );
  }

  return {
    AUTHENTIK_CLIENT_ID,
    AUTHENTIK_CLIENT_SECRET,
    SESSION_SECRET,
    AUTHENTIK_ISSUER,
  };
}

/** request에서 origin URL을 추출 (리버스 프록시 + 멀티 도메인 지원) */
function getAppUrl(request: Request): string {
  const proto =
    process.env.NODE_ENV === "production"
      ? "https"
      : (request.headers.get("X-Forwarded-Proto") ||
          new URL(request.url).protocol.replace(":", ""));
  const host =
    request.headers.get("X-Forwarded-Host") ||
    request.headers.get("Host") ||
    new URL(request.url).host;
  return `${proto}://${host}`;
}

// --- OIDC Endpoints ---

const AUTHORIZE_URL =
  "https://auth.codepoet.site/application/o/authorize/";
const TOKEN_URL = "https://auth.codepoet.site/application/o/token/";
const USERINFO_URL = "https://auth.codepoet.site/application/o/userinfo/";

// --- Session Storage ---

type SessionStorage = ReturnType<
  typeof createCookieSessionStorage<SessionData>
>;

let _sessionStorage: SessionStorage | null = null;

function getSessionStorage(): SessionStorage {
  if (_sessionStorage) return _sessionStorage;

  const env = getEnv();
  _sessionStorage = createCookieSessionStorage<SessionData>({
    cookie: {
      name: "__session",
      secrets: [env.SESSION_SECRET],
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  });
  return _sessionStorage;
}

export async function getSession(request: Request) {
  const storage = getSessionStorage();
  return storage.getSession(request.headers.get("Cookie"));
}

export async function commitSession(
  session: Awaited<ReturnType<typeof getSession>>
) {
  const storage = getSessionStorage();
  return storage.commitSession(session);
}

export async function destroySession(
  session: Awaited<ReturnType<typeof getSession>>
) {
  const storage = getSessionStorage();
  return storage.destroySession(session);
}

// --- User helpers ---

export async function getUser(request: Request): Promise<AuthUser | null> {
  const session = await getSession(request);
  const user = session.get("user");
  if (!user || !user.sub) return null;
  return user as AuthUser;
}

export async function requireUser(request: Request): Promise<AuthUser> {
  const user = await getUser(request);
  if (!user) throw redirect("/login");
  return user;
}

// --- OIDC Flow ---

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getAuthorizationUrl(request: Request) {
  const env = getEnv();
  const appUrl = getAppUrl(request);
  const state = generateState();

  const session = await getSession(request);
  session.set("oauth_state", state);

  const params = new URLSearchParams({
    client_id: env.AUTHENTIK_CLIENT_ID,
    response_type: "code",
    redirect_uri: `${appUrl}/api/auth/callback/authentik`,
    scope: "openid email profile groups",
    state,
  });

  return {
    url: `${AUTHORIZE_URL}?${params.toString()}`,
    cookie: await commitSession(session),
  };
}

export async function handleCallback(request: Request) {
  const env = getEnv();
  const appUrl = getAppUrl(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    throw new Response("Missing code or state parameter", { status: 400 });
  }

  // Verify state
  const session = await getSession(request);
  const savedState = session.get("oauth_state");
  if (state !== savedState) {
    throw new Response("Invalid state parameter", { status: 400 });
  }
  session.unset("oauth_state");

  // Exchange code for tokens
  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${appUrl}/api/auth/callback/authentik`,
      client_id: env.AUTHENTIK_CLIENT_ID,
      client_secret: env.AUTHENTIK_CLIENT_SECRET,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error("Token exchange failed:", error);
    throw new Response("Authentication failed", { status: 401 });
  }

  const tokens = (await tokenResponse.json()) as {
    access_token: string;
    id_token: string;
  };

  // Fetch user info
  const userInfoResponse = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoResponse.ok) {
    console.error("UserInfo fetch failed:", await userInfoResponse.text());
    throw new Response("Failed to fetch user info", { status: 401 });
  }

  const userInfo = (await userInfoResponse.json()) as {
    sub: string;
    email: string;
    name: string;
    groups?: string[];
  };

  const user: AuthUser = {
    sub: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name || userInfo.email,
    groups: userInfo.groups ?? [],
  };

  session.set("user", user);

  return {
    cookie: await commitSession(session),
  };
}
