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
  const opRe =
    /^\s*([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*(?::\s*([A-Za-z0-9_<>]+))?/;

  const lines = useText.split(/\r?\n/).map((l) => l.trim());
  const cls = {
    name: "",
    isAbstract: false,
    superclasses: [],
    attributes: [],
    operations: [],
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
        cls.operations.push({
          name: match[1],
          signature: match[2],
          returnType: match[3] || null,
        });
      }
    }
  }

  return cls;
}

module.exports = parseClassText;