export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  user: { id: string; email: string; name?: string | null };
};

export type ApiErrorShape = {
  error?: { code?: string; message?: string; details?: unknown };
};

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_AUTH_API_BASE_URL;
  return (base ?? "").replace(/\/+$/, "");
}

export async function registerWithEmailPassword(payload: RegisterPayload): Promise<RegisterResponse> {
  const base = apiBase();
  if (!base) {
    throw new Error(
      "Missing NEXT_PUBLIC_AUTH_API_BASE_URL. Set it to your Auth service base URL (e.g. https://auth.cityquest.com).",
    );
  }

  const res = await fetch(`${base}/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = "Registration failed";
    try {
      const data = (await res.json()) as ApiErrorShape;
      msg = data?.error?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  return (await res.json()) as RegisterResponse;
}

