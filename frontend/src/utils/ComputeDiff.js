/**
 * Computes line-by-line diff between two text strings
 * Uses dynamic programming to find the shortest edit script
 * @param {string} originalText - The original text
 * @param {string} modifiedText - The modified text
 * @returns {Array} Array of diff line objects with type, line, and lineNum
 */
export default function computeDiff(originalText, modifiedText) {
  const originalLines = (originalText || '').split('\n');
  const modifiedLines = (modifiedText || '').split('\n');

  const m = originalLines.length;
  const n = modifiedLines.length;

  // Create DP table to track edit distance and operations
  const dp = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => ({ cost: 0, op: null })));

  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = { cost: i, op: 'remove' };
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = { cost: j, op: 'add' };
  }
  dp[0][0] = { cost: 0, op: null };

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (originalLines[i - 1] === modifiedLines[j - 1]) {
        // Lines are the same - no cost
        dp[i][j] = { cost: dp[i - 1][j - 1].cost, op: 'match' };
      } else {
        // Find minimum cost operation
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

  // Backtrack to build diff
  const diffLines = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    const op = dp[i][j].op;

    if (op === 'match') {
      diffLines.unshift({ type: 'unchanged', line: originalLines[i - 1], lineNum: i });
      i--;
      j--;
    } else if (op === 'remove') {
      diffLines.unshift({ type: 'removed', line: originalLines[i - 1], lineNum: i });
      i--;
    } else if (op === 'add') {
      diffLines.unshift({ type: 'added', line: modifiedLines[j - 1], lineNum: j });
      j--;
    } else if (op === 'replace') {
      diffLines.unshift({ type: 'removed', line: originalLines[i - 1], lineNum: i });
      diffLines.unshift({ type: 'added', line: modifiedLines[j - 1], lineNum: j });
      i--;
      j--;
    }
  }

  return diffLines;
}
