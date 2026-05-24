const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function getApiBase(): string {
  return apiBase;
}

export async function apiFetch(
  path: string,
  init: RequestInit & { token?: string | null } = {}
): Promise<Response> {
  const { token, headers, ...rest } = init;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("content-type", "application/json");

  if (token) {
    requestHeaders.set("authorization", `Bearer ${token}`);
  }

  console.log(`Making API request to ${apiBase}${path} with init:`, init);
  return fetch(`${apiBase}${path}`, {
    ...rest,
    headers: requestHeaders
  });
}
