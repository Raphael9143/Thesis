import axiosClient from '../../services/axiosClient';

const testUrl = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (res && res.ok) return true;
    const res2 = await fetch(url, { method: 'GET' });
    return res2 && res2.ok;
  } catch {
    // network or CORS error
    return false;
  }
};

const resolveAttachmentUrls = async (attachments) => {
  if (!Array.isArray(attachments) || attachments.length === 0) return attachments;
  const base = axiosClient.defaults.baseURL || '';
  let origin = '';
  let basePath = '';
  try {
    const u = new URL(base);
    origin = u.origin;
    basePath = (u.pathname || '').replace(/\/$/, '');
  } catch {
    // ignore parse error
  }

  // iterate attachments sequentially to avoid many parallel requests
  for (const att of attachments) {
    try {
      const raw = att.url || att.path || att.filename || '';
      if (!raw) continue;
      if (/^https?:\/\//i.test(raw)) {
        att.__url = raw;
        continue;
      }
      const candidates = [];
      if (raw.startsWith('/')) {
        candidates.push(origin + raw);
        if (basePath) candidates.push(origin + basePath + raw);
      } else {
        candidates.push(origin + '/' + raw.replace(/^\/+/, ''));
        if (basePath) candidates.push(origin + basePath + '/' + raw.replace(/^\/+/, ''));
      }

      let okUrl = null;
      for (const c of candidates) {
        const ok = await testUrl(c);
        if (ok) {
          okUrl = c;
          break;
        }
      }
      if (okUrl) att.__url = okUrl;
    } catch {
      // ignore per-attachment errors
    }
  }

  return attachments;
};

export default { resolveAttachmentUrls };
