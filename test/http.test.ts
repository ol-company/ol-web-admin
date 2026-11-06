import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from '../src/shared/api/http';

describe('apiRequest', () => {
  it('thêm header CSRF cho request ghi, không thêm cho GET', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
    await apiRequest('GET', '/api/x', {}, f);
    await apiRequest('POST', '/api/x', { body: { a: 1 } }, f);
    expect(f.mock.calls[0]![1].headers['x-ol-csrf']).toBeUndefined();
    expect(f.mock.calls[1]![1].headers['x-ol-csrf']).toBe('1');
  });

  it('chuyển problem+json thành ApiError có lý do', async () => {
    const body = JSON.stringify({ status: 403, code: 'forbidden', title: 'Không có quyền', details: { reason: 'no-binding' } });
    const f = vi.fn().mockResolvedValue(new Response(body, { status: 403, headers: { 'content-type': 'application/problem+json' } }));
    await expect(apiRequest('GET', '/api/x', {}, f)).rejects.toMatchObject({ status: 403, details: { reason: 'no-binding' } });
    await expect(apiRequest('GET', '/api/x', {}, f)).rejects.toBeInstanceOf(ApiError);
  });
});
