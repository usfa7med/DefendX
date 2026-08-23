const API_BASE = "";
const API_KEY = import.meta.env.VITE_DEFENDX_API_KEY || "";

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      "defendx-api-key": API_KEY,
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  get: <T>(url: string) => fetcher<T>(url),
  post: <T>(url: string, body: any) =>
    fetcher<T>(url, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(url: string, body: any) =>
    fetcher<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(url: string) => fetcher<T>(url, { method: "DELETE" }),
};
