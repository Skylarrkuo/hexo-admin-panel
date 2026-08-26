const configuredRoot = document.querySelector('meta[name="hexo-admin-root"]')?.content || '/';
const normalizedRoot = configuredRoot.endsWith('/') ? configuredRoot : configuredRoot + '/';
const apiBase = normalizedRoot + 'admin/api';

export const api = {
  token: localStorage.getItem('hexo_admin_token'),
  async request(method, path, body, extraHeaders) {
    const options = { method, headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) } };
    if (this.token) options.headers.Authorization = 'Bearer ' + this.token;
    if (body !== undefined) options.body = JSON.stringify(body);
    const response = await fetch(apiBase + path, options);
    const payload = await response.json();
    if (response.status === 401) { this.logout(); throw new Error('会话已过期'); }
    if (!payload.success) {
      const error = new Error(payload.error || '未知错误');
      error.code = payload.code;
      error.status = response.status;
      throw error;
    }
    return payload.data;
  },
  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  del(path, revision) { return this.request('DELETE', path, undefined, revision ? { 'If-Match': revision } : undefined); },
  async upload(path, formData) {
    const options = { method: 'POST', headers: {}, body: formData };
    if (this.token) options.headers.Authorization = 'Bearer ' + this.token;
    const response = await fetch(apiBase + path, options);
    const payload = await response.json();
    if (response.status === 401) { this.logout(); throw new Error('会话已过期'); }
    if (!payload.success) {
      const error = new Error(payload.error || '上传失败');
      error.code = payload.code;
      error.status = response.status;
      throw error;
    }
    return payload.data;
  },
  logout() { this.token = null; localStorage.removeItem('hexo_admin_token'); }
};

export function assetUrl(value) { return normalizedRoot + String(value || '').replace(/^\//, ''); }
