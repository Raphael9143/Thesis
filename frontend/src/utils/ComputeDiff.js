/**
 * Computes line-by-line diff between two text strings
 * @param {string} originalText - The original text
 * @param {string} modifiedText - The modified text
 * @returns {Array} Array of diff line objects with type, line, and lineNum
 */
export default function computeDiff(originalText, modifiedText) {
  const originalLines = (originalText || '').split('\n');
  const modifiedLines = (modifiedText || '').split('\n');
  const maxLines = Math.max(originalLines.length, modifiedLines.length);

  const diffLines = [];
  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i] || '';
    const modifiedLine = modifiedLines[i] || '';

    if (originalLine !== modifiedLine) {
      if (originalLine && !modifiedLine) {
        // Line removed
        diffLines.push({ type: 'removed', line: originalLine, lineNum: i + 1 });
      } else if (!originalLine && modifiedLine) {
        // Line added
        diffLines.push({ type: 'added', line: modifiedLine, lineNum: i + 1 });
      } else {
        // Line modified
        diffLines.push({ type: 'removed', line: originalLine, lineNum: i + 1 });
        diffLines.push({ type: 'added', line: modifiedLine, lineNum: i + 1 });
      }
    } else {
      // Line unchanged
      diffLines.push({ type: 'unchanged', line: originalLine, lineNum: i + 1 });
    }
  }

  return diffLines;
}
