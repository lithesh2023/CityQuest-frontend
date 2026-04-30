export type ApiError = {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
};

function apiBaseUrl(): string {
  // Local default for your current setup.
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
  return base.replace(/\/+$/, "");
}

async function readError(res: Response): Promise<ApiError> {
  const status = res.status;
  try {
    const data = (await res.json()) as {
      error?: { code?: string; message?: string; details?: unknown };
      message?: string;
    };
    const message = data?.error?.message ?? data?.message ?? `Request failed (${status})`;
    return { status, code: data?.error?.code, message, details: data?.error?.details };
  } catch {
    return { status, message: `Request failed (${status})` };
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { authToken?: string | null },
): Promise<T> {
  const base = apiBaseUrl();
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(init?.headers);
  if (!headers.has("content-type") && init?.body) {
    headers.set("content-type", "application/json");
  }
  if (init?.authToken) {
    headers.set("authorization", `Bearer ${init.authToken}`);
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw await readError(res);
  }

  // 204 / empty body support
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

