/**
 * Parse a `.use` association block into JSON.
 * Expected format:
 * association AssocName between
 *   Class1 [Multiplicity] role Role1
 *   Class2 [Multiplicity] role Role2
 * end
 */
function parseAssociationText(useText) {
  if (!useText || typeof useText !== "string") return null;

  const assocRe =
    /^(association|aggregation|composition|associationclass)\s+([A-Za-z0-9_]+)\s+between/i;
  const partRe =
    /^\s*([A-Za-z0-9_]+)\s*(?:\[([^\]]+)\])?(?:\s+role\s+([A-Za-z0-9_]+))?/i;

  const lines = useText.split(/\r?\n/).map((l) => l.trim());
  const assoc = { name: "", type: "association", parts: [] };

  let mode = "header";
  for (const line of lines) {
    if (!line) continue;

    if (mode === "header") {
      const match = line.match(assocRe);
      if (match) {
        assoc.type = match[1].toLowerCase();
        assoc.name = match[2];
        mode = "parts";
      }
    } else if (mode === "parts") {
      const match = line.match(partRe);
      if (match) {
        assoc.parts.push({
          class: match[1],
          multiplicity: match[2] || null,
          role: match[3] || null,
        });
      }
    }
  }

  return assoc;
}

module.exports = parseAssociationText;