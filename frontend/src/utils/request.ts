const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
let _redirectingToLogin = false;

interface Result<T> {
  code: number;
  message: string;
  data: T;
}

const isResultEnvelope = <T>(value: unknown): value is Result<T> => {
  return !!value
    && typeof value === 'object'
    && 'code' in value
    && ('data' in value || 'message' in value);
};

const isBlockedHtmlResponse = (payload: unknown): boolean => {
  if (typeof payload !== 'string') return false;
  const s = payload.toLowerCase();
  return (s.includes('<html') || s.includes('<!doctype html'))
    && (s.includes('dnspod.qcloud.com/static/webblock.html') || s.includes('webblock'));
};

const handleUnauthorized = (silent?: boolean) => {
  uni.removeStorageSync('token');
  uni.removeStorageSync('userId');
  if (_redirectingToLogin) return;
  _redirectingToLogin = true;
  if (!silent) {
    uni.showToast({ title: '登录已过期，请重新登录', icon: 'none', duration: 2000 });
  }
  setTimeout(() => {
    _redirectingToLogin = false;
    uni.reLaunch({ url: '/pages/login/index' });
  }, 1500);
};

type RequestOptions = UniApp.RequestOptions & {
  silent?: boolean;   // suppress error toasts when true
  _retried?: boolean; // F21: internal flag to prevent double-retry
};

/**
 * Generic Request Function — with F21 global error handling:
 *   - 401: clear token, redirect to login
 *   - 5xx: one auto-retry after 1.5 s, then show toast
 *   - Network fail: friendly Chinese toast + reject
 */
const request = <T>(options: RequestOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token');
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '1',
      ...(options.header as Record<string, string>),
    };
    if (token) header['Authorization'] = `Bearer ${token}`;

    uni.request({
      // AI endpoints can take up to 2 min — keep this floor high
      timeout: 120_000,
      ...options,
      url: `${BASE_URL}${options.url}`,
      header,
      success: (res) => {
        const statusCode = res.statusCode;
        const data = res.data;
        const finalUrl = (res as any)?.errMsg || '';

        // ICP/domain interception usually serves an HTML block page.
        if (isBlockedHtmlResponse(data) || /dnspod|webblock/i.test(finalUrl)) {
          const blockedMsg = '接口被拦截（疑似备案/域名拦截），请切换 IP 地址测试';
          if (!options.silent) {
            uni.showToast({ title: blockedMsg, icon: 'none', duration: 3000 });
          }
          reject(new Error(blockedMsg));
          return;
        }

        if (statusCode >= 200 && statusCode < 300) {
          if (isResultEnvelope<T>(data)) {
            // Some backend handlers return HTTP 200 with business code 401.
            // silent:true 时完全不触发全局处理（不清 token、不跳转），由调用方 catch 处理。
            if (data.code === 401) {
              if (!options.silent) handleUnauthorized(false);
              reject(new Error('Unauthorized'));
              return;
            }
            if (data.code === 200) {
              resolve(data.data);
              return;
            }

            const errorMsg = data.message || `请求失败 (${statusCode})`;
            if (!options.silent) {
              uni.showToast({ title: errorMsg, icon: 'none', duration: 2500 });
            }
            reject(new Error(errorMsg));
            return;
          }

          // Some endpoints return raw arrays/objects/files instead of the
          // common Result envelope. A 2xx HTTP status is still a success.
          resolve(data as T);
          return;
        }

        // F21: 401 → session expired, redirect to login
        // silent:true 时不触发全局重定向，由调用方 catch 处理
        if (statusCode === 401) {
          if (!options.silent) handleUnauthorized(false);
          reject(new Error('Unauthorized'));
          return;
        }

        // F21: 5xx → retry once
        if (statusCode >= 500 && !options._retried) {
          setTimeout(() => {
            request<T>({ ...options, _retried: true }).then(resolve).catch(reject);
          }, 1500);
          return;
        }

        const errorMsg = isResultEnvelope<T>(data) && data.message
          ? data.message
          : `请求失败 (${statusCode})`;
        if (!options.silent) {
          uni.showToast({ title: errorMsg, icon: 'none', duration: 2500 });
        }
        reject(new Error(errorMsg));
      },
      fail: (_err) => {
        if (!options.silent) {
          uni.showToast({ title: '网络异常，请检查网络连接', icon: 'none', duration: 2500 });
        }
        reject(new Error('网络异常，请检查网络连接'));
      },
    });
  });
};

export default request;

