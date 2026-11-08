// TẦNG TRUY CẬP DỮ LIỆU dùng chung: mọi lời gọi API đi qua đây.
//  - Cùng origin với BFF → cookie phiên tự gửi, không cần CORS, không có token trong JS
//  - Tự thêm header chống CSRF cho request ghi
//  - Chuẩn hóa lỗi problem+json thành ApiError
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
    readonly requestId?: string,
  ) {
    super(message);
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export async function apiRequest<T>(
  method: Method,
  path: string,
  options: RequestOptions = {},
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json', ...options.headers };
  if (method !== 'GET') headers['x-ol-csrf'] = '1';
  if (options.body !== undefined) headers['content-type'] = 'application/json';

  const res = await fetchImpl(path, {
    method,
    headers,
    credentials: 'same-origin',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (res.status === 401) {
    // Phiên hết hạn hoặc bị thu hồi → đăng nhập lại và quay về trang hiện tại
    if (typeof window !== 'undefined') {
      window.location.assign(
        `/auth/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
    }
    throw new ApiError(401, 'unauthenticated', 'Phiên đăng nhập đã hết hạn');
  }
  if (res.status === 204) return undefined as T;

  const isJson = (res.headers.get('content-type') ?? '').includes('json');
  const payload: unknown = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const p = (typeof payload === 'object' && payload !== null ? payload : {}) as Record<
      string,
      unknown
    >;
    throw new ApiError(
      res.status,
      String(p.code ?? 'http_error'),
      String(p.title ?? `HTTP ${res.status}`),
      p.details,
      p.requestId as string | undefined,
    );
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string, o?: RequestOptions) => apiRequest<T>('GET', path, o),
  post: <T>(path: string, body?: unknown, o?: RequestOptions) =>
    apiRequest<T>('POST', path, { ...o, body }),
  put: <T>(path: string, body?: unknown, o?: RequestOptions) =>
    apiRequest<T>('PUT', path, { ...o, body }),
  delete: <T>(path: string, o?: RequestOptions) => apiRequest<T>('DELETE', path, o),
};

// Thông báo lỗi thân thiện theo mã lỗi
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const reason = (err.details as { reason?: string } | undefined)?.reason;
    if (err.status === 403 && reason === 'mfa-required')
      return 'Thao tác quản trị yêu cầu MFA. Hãy đăng xuất và đăng nhập lại để thiết lập.';
    if (err.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (err.status === 503)
      return 'Hệ thống phân quyền tạm thời không khả dụng, hãy thử lại sau ít giây.';
    return `${err.message}${err.requestId ? ` (mã yêu cầu: ${err.requestId})` : ''}`;
  }
  return 'Đã xảy ra lỗi không xác định.';
}
