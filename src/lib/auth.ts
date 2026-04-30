import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

function adminEmails() {
  const fromEnv = process.env.ADMIN_EMAILS ?? "";
  const emails = fromEnv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length) return emails;
  return ["test@cityquest.app"];
}

type BackendLoginOk = {
  user: { id: string; email: string; name?: string | null; role?: string | null };
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresIn?: number | null;
};

function extractAuthUser(payload: Record<string, unknown>): BackendLoginOk["user"] | undefined {
  const direct = payload.user as BackendLoginOk["user"] | undefined;
  if (direct && typeof direct === "object" && direct.email) return direct;
  const nested = payload.data as Record<string, unknown> | undefined;
  const nestedUser = nested?.user as BackendLoginOk["user"] | undefined;
  if (nestedUser && typeof nestedUser === "object" && nestedUser.email) return nestedUser;
  return undefined;
}

function extractTokens(payload: Record<string, unknown>): { accessToken?: string; refreshToken?: string } {
  const access_token = payload.access_token;
  const refresh_token = payload.refresh_token;
  const nested = payload.data as Record<string, unknown> | undefined;
  const nestedAccess = nested?.access_token;
  const nestedRefresh = nested?.refresh_token;

  const accessToken =
    (typeof access_token === "string" ? access_token : undefined) ??
    (typeof nestedAccess === "string" ? nestedAccess : undefined);
  const refreshToken =
    (typeof refresh_token === "string" ? refresh_token : undefined) ??
    (typeof nestedRefresh === "string" ? nestedRefresh : undefined);
  return { accessToken, refreshToken };
}

function extractExpiresIn(payload: Record<string, unknown>): number | undefined {
  const top = payload.expires_in;
  const nested = (payload.data as Record<string, unknown> | undefined)?.expires_in;
  const fromTop = typeof top === "number" && Number.isFinite(top) ? top : undefined;
  const fromNested = typeof nested === "number" && Number.isFinite(nested) ? nested : undefined;
  return fromTop ?? fromNested;
}

function decodeJwtExpMs(token?: string | null): number | undefined {
  if (!token) return undefined;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return undefined;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { exp?: number };
    if (!payload?.exp || !Number.isFinite(payload.exp)) return undefined;
    return payload.exp * 1000;
  } catch {
    return undefined;
  }
}

/** Server-side base URL for auth API calls (NextAuth runs on the server). */
function authApiBaseUrl(): string {
  const base =
    process.env.AUTH_API_BASE_URL ??
    process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";
  return base.replace(/\/+$/, "");
}

async function backendLogin(email: string, password: string): Promise<BackendLoginOk | null> {
  const base = authApiBaseUrl();
  if (!base) return null;

  const res = await fetch(`${base}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  const user = extractAuthUser(data);
  if (!user) return null;
  const tokens = extractTokens(data);
  const expiresIn = extractExpiresIn(data);
  return {
    user,
    accessToken: tokens.accessToken ?? null,
    refreshToken: tokens.refreshToken ?? null,
    expiresIn: expiresIn ?? null,
  };
}

async function backendOauthExchange(code: string, redirectUri: string): Promise<BackendLoginOk | null> {
  const base = authApiBaseUrl();
  if (!base) return null;

  const res = await fetch(`${base}/v1/auth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  const user = extractAuthUser(data);
  if (!user) return null;
  const tokens = extractTokens(data);
  const expiresIn = extractExpiresIn(data);
  return {
    user,
    accessToken: tokens.accessToken ?? null,
    refreshToken: tokens.refreshToken ?? null,
    expiresIn: expiresIn ?? null,
  };
}

async function backendRefresh(refreshToken: string): Promise<{
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
} | null> {
  const base = authApiBaseUrl();
  if (!base) return null;

  const res = await fetch(`${base}/v1/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as Record<string, unknown>;
  const tokens = extractTokens(data);
  const expiresIn = extractExpiresIn(data);
  const decodedExp = decodeJwtExpMs(tokens.accessToken);
  const now = Date.now();
  const fromExpiresIn = typeof expiresIn === "number" ? now + expiresIn * 1000 : undefined;
  const accessTokenExpiresAt = decodedExp ?? fromExpiresIn;

  if (!tokens.accessToken) return null;
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? refreshToken,
    accessTokenExpiresAt,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        oauthCode: { label: "OAuth Code", type: "text" },
        redirectUri: { label: "Redirect URI", type: "text" },
      },
      async authorize(credentials) {
        const oauthCode = credentials?.oauthCode?.trim();
        const redirectUri = credentials?.redirectUri?.trim();
        if (oauthCode && redirectUri) {
          const backend = await backendOauthExchange(oauthCode, redirectUri);
          if (!backend?.user) return null;
          return {
            id: backend.user.id,
            name: backend.user.name ?? backend.user.email,
            email: backend.user.email,
            role: backend.user.role ?? "user",
            accessToken: backend.accessToken ?? undefined,
            refreshToken: backend.refreshToken ?? undefined,
            accessTokenExpiresAt:
              decodeJwtExpMs(backend.accessToken) ??
              (typeof backend.expiresIn === "number" ? Date.now() + backend.expiresIn * 1000 : undefined),
          };
        }

        const email = credentials?.email?.trim();
        const password = credentials?.password ?? "";

        if (!email || !password) return null;

        const backend = await backendLogin(email, password);
        if (backend?.user) {
          return {
            id: backend.user.id,
            name: backend.user.name ?? backend.user.email,
            email: backend.user.email,
            role: backend.user.role ?? "user",
            accessToken: backend.accessToken ?? undefined,
            refreshToken: backend.refreshToken ?? undefined,
            accessTokenExpiresAt:
              decodeJwtExpMs(backend.accessToken) ??
              (typeof backend.expiresIn === "number" ? Date.now() + backend.expiresIn * 1000 : undefined),
          };
        }

        // Optional local demo user (matches backend seed); set DEMO_EMAIL + DEMO_PASSWORD in .env.local.
        const demoEmail = process.env.DEMO_EMAIL?.trim().toLowerCase();
        const demoPassword = process.env.DEMO_PASSWORD ?? "";
        if (demoEmail && demoPassword && email.toLowerCase() === demoEmail && password === demoPassword) {
          return {
            id: demoEmail,
            name: "Demo Explorer",
            email: demoEmail,
            role: "user",
          };
        }

        // Dev fallback until backend is wired.
        const TEST_EMAIL = "test@cityquest.app";
        const TEST_PASSWORD = "CityQuest@123";
        if (email.toLowerCase() !== TEST_EMAIL || password !== TEST_PASSWORD) return null;
        const isAdmin = adminEmails().includes(TEST_EMAIL);
        return { id: TEST_EMAIL, name: "Test Explorer", email: TEST_EMAIL, role: isAdmin ? "admin" : "user" };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me",
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "user";
        const at = (user as { accessToken?: unknown }).accessToken;
        const rt = (user as { refreshToken?: unknown }).refreshToken;
        const ae = (user as { accessTokenExpiresAt?: unknown }).accessTokenExpiresAt;
        if (typeof at === "string" && at) (token as unknown as { accessToken?: string }).accessToken = at;
        if (typeof rt === "string" && rt) (token as unknown as { refreshToken?: string }).refreshToken = rt;
        if (typeof ae === "number" && Number.isFinite(ae)) {
          (token as unknown as { accessTokenExpiresAt?: number }).accessTokenExpiresAt = ae;
        } else {
          const derived = decodeJwtExpMs(typeof at === "string" ? at : undefined);
          if (derived) (token as unknown as { accessTokenExpiresAt?: number }).accessTokenExpiresAt = derived;
        }
      }

      const accessToken = (token as unknown as { accessToken?: string }).accessToken;
      const refreshToken = (token as unknown as { refreshToken?: string }).refreshToken;
      const expiresAt = (token as unknown as { accessTokenExpiresAt?: number }).accessTokenExpiresAt;
      const now = Date.now();
      const skewMs = 30_000;
      if (accessToken && expiresAt && now >= expiresAt - skewMs && refreshToken) {
        const refreshed = await backendRefresh(refreshToken);
        if (refreshed?.accessToken) {
          (token as unknown as { accessToken?: string }).accessToken = refreshed.accessToken;
          (token as unknown as { refreshToken?: string }).refreshToken =
            refreshed.refreshToken ?? refreshToken;
          (token as unknown as { accessTokenExpiresAt?: number }).accessTokenExpiresAt =
            refreshed.accessTokenExpiresAt ?? decodeJwtExpMs(refreshed.accessToken);
          delete (token as unknown as { error?: string }).error;
        } else {
          (token as unknown as { error?: string }).error = "RefreshAccessTokenError";
        }
      }

      const email = String(token.email ?? "").toLowerCase();
      if (email && adminEmails().includes(email)) {
        token.role = "admin";
      }
      return token;
    },
    async session({ session, token }) {
      (session as unknown as { role?: string }).role =
        (token as unknown as { role?: string }).role ?? "user";
      (session as unknown as { accessToken?: string | null }).accessToken =
        (token as unknown as { accessToken?: string }).accessToken ?? null;
      (session as unknown as { error?: string }).error =
        (token as unknown as { error?: string }).error;
      return session;
    },
  },
};

