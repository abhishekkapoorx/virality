const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function getApiBase(): string {
  return apiBase;
}

export async function apiFetch(
  path: string,
  init: RequestInit & { token?: string | null } = {}
): Promise<Response> {
  const { token, headers, ...rest } = init;
  const authHeaders: Record<string, string> = {};

  if (token) {
    authHeaders.Authorization = `Bearer ${token}`;
  }

  return fetch(`${apiBase}${path}`, {
    ...rest,
    headers: {
      "content-type": "application/json",
      ...authHeaders,
      ...(headers as Record<string, string> | undefined)
    }
  });
}
