/**
 * Parse a `.use` class block into JSON.
 * Expected format:
 * class ClassName [< Superclass1, Superclass2]
 *   attributes
 *     attrName : Type
 *   operations
 *     opName(params) : ReturnType
 * end
 */
function parseClassText(useText) {
  if (!useText || typeof useText !== "string") return null;

  const classRe =
    /^\s*(abstract\s+)?class\s+([A-Za-z0-9_]+)(?:\s+<\s+([^{\n]+))?/i;
  const attrRe = /^\s*([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_<>]+)\s*$/;
  // allow qualified operation names (Class::op) and parameterized return types like Set(Account)
  const opRe =
    /^\s*([A-Za-z0-9_:]+)\s*\(([^)]*)\)\s*(?::\s*([^=\n]+))?/;

  const lines = useText.split(/\r?\n/).map((l) => l.trim());
  const cls = {
    name: "",
    isAbstract: false,
    superclasses: [],
    attributes: [],
    operations: [],
    query_operations: [],
  };

  let mode = "header";
  for (const line of lines) {
    if (!line) continue;

    if (mode === "header") {
      const match = line.match(classRe);
      if (match) {
        cls.isAbstract = Boolean(match[1]);
        cls.name = match[2];
        if (match[3]) {
          cls.superclasses = match[3].split(/,\s*/).filter(Boolean);
        }
        mode = "body";
      }
    } else if (mode === "body") {
      if (/^attributes$/i.test(line)) {
        mode = "attributes";
      } else if (/^operations$/i.test(line)) {
        mode = "operations";
      }
    } else if (mode === "attributes") {
      const match = line.match(attrRe);
      if (match) {
        cls.attributes.push({ name: match[1], type: match[2] });
      } else if (/^operations$/i.test(line)) {
        mode = "operations";
      }
    } else if (mode === "operations") {
      const match = line.match(opRe);
      if (match) {
        const name = match[1];
        const signature = match[2];
        const returnType = match[3] ? String(match[3]).trim() : null;
        // detect inline body after '=' on the same line
        let inlineBody = null;
        const eqIdx = line.indexOf("=");
        if (eqIdx >= 0) inlineBody = line.slice(eqIdx + 1).trim();

        // Heuristic to detect query operations:
        // - inline body present (e.g. '= expr')
        // - contains navigation '->'
        // - starts with 'if' or an opening parenthesis
        const looksLikeQuery =
          Boolean(inlineBody) || /->/.test(line) || /^\s*if\b/i.test(line) || /^\s*\(/.test(line);

        const opObj = {
          name,
          signature,
          returnType,
        };
        if (inlineBody) opObj.body = inlineBody;

        if (looksLikeQuery) cls.query_operations.push(opObj);
        else cls.operations.push(opObj);
      }
    }
  }

  return cls;
}

module.exports = parseClassText;