import axiosClient from '../../services/axiosClient';

const toFullUrl = (path) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  try {
    const base = axiosClient.defaults.baseURL || '';
    const origin = new URL(base).origin;
    if (path.startsWith('/')) return origin + path;
    return origin + '/' + path.replace(/^\/+/, '');
  } catch (err) {
    console.error('toFullUrl error:', err);
    return path;
  }
};

export default toFullUrl;
