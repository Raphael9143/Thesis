export default function formatFeedback(feedback) {
  if (!feedback) return '';
  let obj = feedback;
  if (typeof feedback === 'string') {
    try {
      obj = JSON.parse(feedback);
    } catch (err) {
      // not JSON, return raw string
      return String(feedback);
    }
  }

  if (typeof obj === 'object' && obj !== null) {
    // Prefer a simple pretty format: one key per line, humanized key names
    const lines = [];
    const humanize = (k) =>
      k
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase());
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      lines.push(`${humanize(key)}: ${val}`);
    }
    return lines.join('\n');
  }

  return String(feedback);
}
