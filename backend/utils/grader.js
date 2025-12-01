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
  // For class names, require name-level matching: proportion of answer classes
  // that exactly appear in submission classes (case-insensitive).
  let classScore = 0;
  if (A.classes && A.classes.length > 0) {
    const aSet = new Set(A.classes || []);
    const bSet = new Set(B.classes || []);
    let matches = 0;
    for (const name of aSet) {
      if (bSet.has(name)) matches++;
    }
    classScore = matches / A.classes.length;
  } else {
    // fallback to jaccard when answer has no class names
    classScore = jaccardScore(A.classes, B.classes);
  }
  const opScore = jaccardScore(A.operations, B.operations);
  const invScore = jaccardScore(A.constraints, B.constraints);
  // weights: give stronger importance to class name matches
  const weights = { classes: 0.6, ops: 0.3, inv: 0.1 };
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
    // Use only component similarity. Scale to 10-point scale.
    const scoreOutOf10 = Math.round(comp * 10);
    const feedback = `Component Similarity: ${scoreOutOf10}/10`;
    return { score: scoreOutOf10, feedback };
  } catch (e) {
    return { score: null, feedback: String(e.message || e) };
  }
}

module.exports = { gradeUseModels, textSimilarity, componentSimilarity };
