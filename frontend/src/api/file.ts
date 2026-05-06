import request from '@/utils/request';

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
// Keep uploadFile aligned with request.ts fallback during ICP/domain interception.
const BASE_URL = /api\.careerloop\.top/i.test(RAW_BASE_URL)
  ? 'http://129.28.97.93:8088'
  : RAW_BASE_URL;

const isBlockedHtmlResponse = (payload: unknown): boolean => {
  if (typeof payload !== 'string') return false;
  const s = payload.toLowerCase();
  return (s.includes('<html') || s.includes('<!doctype html'))
    && (s.includes('dnspod.qcloud.com/static/webblock.html') || s.includes('webblock'));
};

/**
 * Upload a file to OSS via the backend.
 *
 * The backend returns a bare object key (e.g. `resumes/uuid.pdf`), NOT a
 * publicly loadable URL. Persist the key with the entity (resume row,
 * user.avatarUrl, etc.) and call `getFileViewUrlApi` if you ever need a
 * short-lived signed URL outside of the normal entity-fetch flow — most
 * pages will get one for free in the entity's `*ViewUrl` field.
 *
 * @param filePath local file path (from uni.chooseFile / chooseImage)
 * @param folder   OSS folder prefix (default: `resumes`)
 * @returns OSS object key
 */
export const uploadFileApi = (filePath: string, folder: string = 'resumes'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token');

    uni.uploadFile({
      url: `${BASE_URL}/api/files/upload`,
      filePath: filePath,
      name: 'file',
      formData: { folder },
      header: {
        Authorization: token ? `Bearer ${token}` : '',
        // Required when the backend is behind ngrok-free.dev (otherwise we
        // get the abuse interstitial HTML instead of the JSON envelope).
        'ngrok-skip-browser-warning': '1',
      },
      success: (res) => {
        console.log('Upload response:', res.statusCode, res.data);
        if (isBlockedHtmlResponse(res.data)) {
          reject(new Error('接口被拦截（疑似备案/域名拦截），请切换 IP 地址测试'));
          return;
        }
        if (res.statusCode === 200) {
          try {
            const body = JSON.parse(res.data);
            if (body.code === 200) {
              resolve(body.data);
            } else {
              reject(new Error(body.message || `Upload failed (code: ${body.code})`));
            }
          } catch (e) {
            reject(new Error(`Invalid upload response: ${res.data}`));
          }
        } else {
          reject(new Error(`Upload failed (status: ${res.statusCode})`));
        }
      },
      fail: (err) => {
        console.error('Upload error:', err);
        reject(err);
      },
    });
  });
};

