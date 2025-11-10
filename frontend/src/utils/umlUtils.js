// Utility helpers for UML preview
// pure functions (no DOM or React closures)

const offsetAlong = (from, to, dist = 14) => {
  const vx = to.x - from.x;
  const vy = to.y - from.y;
  const len = Math.sqrt(vx * vx + vy * vy) || 1;
  return { x: from.x + (vx / len) * dist, y: from.y + (vy / len) * dist };
};

const pushOutward = (pt, center, extra = 18) => {
  const vx = pt.x - center.x;
  const vy = pt.y - center.y;
  const len = Math.sqrt(vx * vx + vy * vy) || 1;
  return { x: pt.x + (vx / len) * extra, y: pt.y + (vy / len) * extra };
};

const perpOffset = (pt, towards, other, perp = 12, along = 6) => {
  // pt: base point on edge; towards: center of owning box; other: the other end center
  const ux = other.x - pt.x;
  const uy = other.y - pt.y;
  const ulen = Math.sqrt(ux * ux + uy * uy) || 1;
  const vx = ux / ulen;
  const vy = uy / ulen;
  // normal (perpendicular) vector
  let nx = -vy;
  let ny = vx;
  // choose sign so normal points away from the owning box center
  const dot = (pt.x - towards.x) * nx + (pt.y - towards.y) * ny;
  const sign = dot >= 0 ? 1 : -1;
  nx *= sign;
  ny *= sign;
  return { x: pt.x + nx * perp + vx * along, y: pt.y + ny * perp + vy * along };
};

const intersectBorder = (rect, from, to) => {
  if (!rect) return from;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = to.x - cx;
  const dy = to.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const candidates = [];
  if (dx !== 0) {
    const t1 = (rect.left - cx) / dx;
    const y1 = cy + t1 * dy;
    if (t1 >= 0 && y1 >= rect.top && y1 <= rect.top + rect.height) {
      candidates.push({ t: t1, x: rect.left, y: y1 });
    }
    const t2 = (rect.left + rect.width - cx) / dx;
    const y2 = cy + t2 * dy;
    if (t2 >= 0 && y2 >= rect.top && y2 <= rect.top + rect.height) {
      candidates.push({ t: t2, x: rect.left + rect.width, y: y2 });
    }
  }
  if (dy !== 0) {
    const t3 = (rect.top - cy) / dy;
    const x3 = cx + t3 * dx;
    if (t3 >= 0 && x3 >= rect.left && x3 <= rect.left + rect.width) {
      candidates.push({ t: t3, x: x3, y: rect.top });
    }
    const t4 = (rect.top + rect.height - cy) / dy;
    const x4 = cx + t4 * dx;
    if (t4 >= 0 && x4 >= rect.left && x4 <= rect.left + rect.width) {
      candidates.push({ t: t4, x: x4, y: rect.top + rect.height });
    }
  }
  if (candidates.length === 0) return { x: cx, y: cy };
  candidates.sort((a, b) => a.t - b.t);
  return { x: candidates[0].x, y: candidates[0].y };
};

const fmtMultiplicity = (part) => {
  if (!part) return '';
  if (typeof part.multiplicity === 'string' && part.multiplicity.trim()) return part.multiplicity.trim();
  if (typeof part.cardinality === 'string' && part.cardinality.trim()) return part.cardinality.trim();
  const min = part.min ?? part.lower ?? part.lowerBound ?? '';
  const max = part.max ?? part.upper ?? part.upperBound ?? '';
  if ((min === '' || min === null) && (max === '' || max === null)) {
    if (part.range && typeof part.range === 'string') return part.range;
    return '';
  }
  if (max === '' || max === null) {
    if (min === '' || min === null) return '*';
    return `${min}..*`;
  }
  if (String(min) === String(max)) return String(min);
  return `${min}..${max}`;
};

export { offsetAlong, pushOutward, perpOffset, intersectBorder, fmtMultiplicity };
