const { parseUseContentWithConditionals } = require("./parseUse");

function levenshtein(a, b) {
  if (!a) return b ? b.length : 0;
  if (!b) return a.length;
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function textSimilarity(a, b) {
  const aa = (a || "").replace(/\s+/g, " ").trim().toLowerCase();
  const bb = (b || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!aa && !bb) return 1;
  const dist = levenshtein(aa, bb);
  const maxLen = Math.max(aa.length, bb.length, 1);
  return Math.max(0, 1 - dist / maxLen);
}

function jaccardScore(setA, setB) {
  if ((!setA || setA.length === 0) && (!setB || setB.length === 0)) return 1;
  const a = new Set(setA || []);
  const b = new Set(setB || []);
  const inter = Array.from(a).filter((x) => b.has(x)).length;
  const uni = new Set([...Array.from(a), ...Array.from(b)]).size;
  if (uni === 0) return 0;
  return inter / uni;
}

function extractComponentSets(parsed) {
  const classes = (parsed.classes || []).map((c) =>
    (c.name || "").toLowerCase()
  );
  const ops = [];
  for (const c of parsed.classes || []) {
    for (const o of (c.operations || []).concat(c.query_operations || [])) {
      const sig = (o.fullName || o.name || "").toLowerCase();
      ops.push(sig);
    }
  }
  const assOps = (parsed.associations || []).flatMap((a) =>
    (a.operations || []).map((o) => (o.name || "").toLowerCase())
  );
  const constraints = (parsed.constraints || []).map((c) =>
    ((c.name || "") + ":" + (c.expression || "")).toLowerCase()
  );
  return { classes, operations: ops.concat(assOps), constraints };
}

function componentSimilarity(parsedA, parsedB) {
  const A = extractComponentSets(parsedA || {});
  const B = extractComponentSets(parsedB || {});
  const classScore = jaccardScore(A.classes, B.classes);
  const opScore = jaccardScore(A.operations, B.operations);
  const invScore = jaccardScore(A.constraints, B.constraints);
  // weights: classes 40%, ops 40%, constraints 20%
  const weights = { classes: 0.4, ops: 0.4, inv: 0.2 };
  // if no constraints in either, redistribute weight
  let invWeight = weights.inv;
  let total = weights.classes + weights.ops + invWeight;
  if (
    (!A.constraints || A.constraints.length === 0) &&
    (!B.constraints || B.constraints.length === 0)
  ) {
    invWeight = 0;
    // redistribute evenly to classes and ops
    total = weights.classes + weights.ops;
    return (
      classScore * (weights.classes / total) + opScore * (weights.ops / total)
    );
  }
  return (
    classScore * weights.classes + opScore * weights.ops + invScore * invWeight
  );
}

function gradeUseModels(answerText, submissionText) {
  try {
    const parsedA = parseUseContentWithConditionals(answerText || "");
    const parsedS = parseUseContentWithConditionals(submissionText || "");
    const comp = componentSimilarity(parsedA, parsedS);
    const txt = textSimilarity(answerText || "", submissionText || "");
    // combine: components (60%) + text similarity (40%)
    const score = Math.round((comp * 0.6 + txt * 0.4) * 100);
    const details = {
      component_similarity: Number(comp.toFixed(3)),
      text_similarity: Number(txt.toFixed(3)),
    };
    return { score, details };
  } catch (e) {
    return { score: null, details: { error: e.message || String(e) } };
  }
}

module.exports = { gradeUseModels, textSimilarity, componentSimilarity };
