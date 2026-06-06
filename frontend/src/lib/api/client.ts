import { API_BASE_URL } from "@/lib/constants/config";
import type { Paginated } from "@/types/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function flattenApiError(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenApiError);
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(flattenApiError);
  }
  return [String(value)];
}

export function parseApiErrorBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const record = body as Record<string, unknown>;
  if (typeof record.detail === "string" && record.detail) return record.detail;

  const messages = [
    ...flattenApiError(record.non_field_errors),
    ...flattenApiError(record),
  ].filter((message, index, list) => message && list.indexOf(message) === index);

  return messages[0] ?? fallback;
}

type FetchOptions = {
  revalidate?: number | false;
  cache?: RequestCache;
  method?: string;
  body?: string;
  token?: string | null;
};

export async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  options: FetchOptions = { revalidate: 60 },
): Promise<T> {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Token ${options.token}`;

  const init: RequestInit & { next?: { revalidate?: number | false } } = {
    method: options.method ?? "GET",
    headers,
  };

  if (options.body) init.body = options.body;

  if (options.cache) {
    init.cache = options.cache;
  } else if (options.revalidate === false) {
    init.cache = "no-store";
  } else if (!options.token) {
    init.next = { revalidate: options.revalidate ?? 60 };
  } else {
    init.cache = "no-store";
  }

  const controller = new AbortController();
  const timeoutMs = 20_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  init.signal = controller.signal;

  let res: Response;
  try {
    res = await fetch(url.toString(), init);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("مهلت اتصال به سرور تمام شد.", 408);
    }
    throw new ApiError("اتصال به سرور برقرار نشد.", 0);
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    const fallback = `API ${res.status}: ${path}`;
    let detail = fallback;
    try {
      const err = await res.json();
      detail = parseApiErrorBody(err, fallback);
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiFetchAuth<T>(
  path: string,
  token: string,
  options: Omit<FetchOptions, "token"> = { revalidate: false },
): Promise<T> {
  return apiFetch<T>(path, undefined, { ...options, token, revalidate: false });
}

export async function fetchPaginated<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T[]> {
  const data = await apiFetch<Paginated<T>>(path, params);
  return data.results ?? [];
}
