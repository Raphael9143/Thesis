/**
 * Improved line-by-line diff using dynamic programming
 * Clean backtracking, correct replace ordering, stable line numbers,
 * and fixed collapse/context logic.
 */
export default function computeDiff(originalText, modifiedText, options = {}) {
  const { context = 3, collapse = true, trimTrailingWhitespace = true } = options;

  const normalize = (t) => {
    if (!trimTrailingWhitespace) return t;
    return t.replace(/[\s]+$/g, '');
  };

  const originalLines = (originalText || '').split('\n').map(normalize);
  const modifiedLines = (modifiedText || '').split('\n').map(normalize);
  const m = originalLines.length;
  const n = modifiedLines.length;

  // DP
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = { cost: i, op: i === 0 ? 'done' : 'remove' };
  for (let j = 0; j <= n; j++) dp[0][j] = { cost: j, op: j === 0 ? 'done' : 'add' };

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (originalLines[i - 1] === modifiedLines[j - 1]) {
        dp[i][j] = { cost: dp[i - 1][j - 1].cost, op: 'match' };
      } else {
        const removeCost = dp[i - 1][j].cost + 1;
        const addCost = dp[i][j - 1].cost + 1;
        const replaceCost = dp[i - 1][j - 1].cost + 1;

        if (removeCost <= addCost && removeCost <= replaceCost) {
          dp[i][j] = { cost: removeCost, op: 'remove' };
        } else if (addCost <= replaceCost) {
          dp[i][j] = { cost: addCost, op: 'add' };
        } else {
          dp[i][j] = { cost: replaceCost, op: 'replace' };
        }
      }
    }
  }

  // Backtrack
  const ops = [];
  let i = m,
    j = n;

  while (!(i === 0 && j === 0)) {
    const { op } = dp[i][j];

    if (op === 'match') {
      ops.unshift({ type: 'unchanged', line: originalLines[i - 1] });
      i--;
      j--;
    } else if (op === 'replace') {
      // correct order: removed then added
      ops.unshift({ type: 'removed', line: originalLines[i - 1] });
      ops.unshift({ type: 'added', line: modifiedLines[j - 1] });
      i--;
      j--;
    } else if (op === 'remove') {
      ops.unshift({ type: 'removed', line: originalLines[i - 1] });
      i--;
    } else if (op === 'add') {
      ops.unshift({ type: 'added', line: modifiedLines[j - 1] });
      j--;
    } else {
      // op = 'done'
      break;
    }
  }

  // Numbering
  let origNum = 0,
    modNum = 0;
  const withNums = ops.map((o) => {
    if (o.type === 'unchanged') {
      origNum++;
      modNum++;
      return { ...o, origLineNum: origNum, modLineNum: modNum };
    }
    if (o.type === 'removed') {
      origNum++;
      return { ...o, origLineNum: origNum, modLineNum: null };
    }
    if (o.type === 'added') {
      modNum++;
      return { ...o, origLineNum: null, modLineNum: modNum };
    }
  });

  if (!collapse) return withNums;

  // Context / Collapse
  const changedIndices = withNums.flatMap((l, idx) => (l.type !== 'unchanged' ? idx : []));

  if (changedIndices.length === 0) return withNums.slice(0, 300);

  const show = new Set();
  for (const ci of changedIndices) {
    for (let k = ci - context; k <= ci + context; k++) {
      if (k >= 0 && k < withNums.length) show.add(k);
    }
  }

  const result = [];
  let skipping = false;
  let skipCount = 0;

  for (let idx = 0; idx < withNums.length; idx++) {
    if (show.has(idx)) {
      if (skipping) {
        result.push({ type: 'skip', skipCount });
        skipCount = 0;
        skipping = false;
      }
      result.push(withNums[idx]);
    } else {
      skipping = true;
      skipCount++;
    }
  }

  if (skipping) result.push({ type: 'skip', skipCount });

  return result;
}
