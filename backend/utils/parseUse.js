// parseUse.js - helpers to parse .use content and extract CLI-style errors

function parseUseContent(content) {
  const res = { model: null, enums: [], classes: [], associations: [] };

  if (!content || typeof content !== "string") return res;

  const modelMatch = content.match(/model\s+(\w+)/i);
  if (modelMatch) res.model = modelMatch[1];

  // Enums
  const enumRe = /enum\s+(\w+)\s*\{([\s\S]*?)\}/gi;
  let em;
  while ((em = enumRe.exec(content)) !== null) {
    const name = em[1];
    const body = em[2] || "";
    const values = body
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    res.enums.push({ name, values });
  }

  // Classes (robust, multiline-aware)
  const classBlockRe =
    /^\s*(?:abstract\s+)?class\s+[A-Za-z0-9_][\s\S]*?^end\b/gim;
  let cb;
  while ((cb = classBlockRe.exec(content)) !== null) {
    const block = cb[0];

    // header
    const headerMatch = block.match(/^\s*(abstract\s+)?class\s+([^\r\n]+)/im);
    let name = "Unknown";
    let isAbstract = false;
    let superclasses = [];
    if (headerMatch) {
      isAbstract = Boolean(headerMatch[1]);
      const afterClass = headerMatch[2].trim();
      const nameOnlyMatch = afterClass.match(/^([A-Za-z0-9_]+)/);
      if (nameOnlyMatch) name = nameOnlyMatch[1];
      const genMatch = afterClass.match(/<\s*([^\n]+)/);
      if (genMatch) {
        superclasses = genMatch[1]
          .split(/,/) // multiple inheritance separated by commas
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    const cls = {
      name,
      isAbstract,
      superclasses,
      attributes: [],
      operations: [],
      // query-style operations (have bodies or '=' inline bodies)
      query_operations: [],
    };

    // attributes
    const attrMatch = block.match(
      /attributes\s*([\s\S]*?)(?:operations\b|\n\s*end\b)/im
    );
    if (attrMatch) {
      const attrBody = attrMatch[1] || "";
      const lines = attrBody
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (const line of lines) {
        const m = line.match(/^([a-zA-Z0-9_]+)\s*:\s*([^\r\n]+)\s*$/);
        if (m) cls.attributes.push({ name: m[1], type: m[2] });
      }
    }

    // operations: allow multi-line bodies; avoid treating OCL keywords
    const opMatch = block.match(/operations\s*([\s\S]*?)(?=\n\s*end\b)/im);
    if (opMatch) {
      const opBody = opMatch[1] || "";
      const rawLines = opBody.split(/\r?\n/);

      const sr =
        /^\s*([A-Za-z0-9_:]+)\s*\(([^)]*)\)\s*(?::\s*([^=\n]+))?\s*(?:=\s*(.*))?$/;
      const headerReserved =
        /^(?:if|then|else|endif|let|in|collect|select|reject|forAll|exists|closure)\b/i;

      const opStartIdx = [];
      for (let i = 0; i < rawLines.length; i++) {
        const t = rawLines[i].trim();
        if (!t) continue;
        if (sr.test(t) && !headerReserved.test(t)) opStartIdx.push(i);
      }
      if (!opStartIdx.length) {
        for (let i = 0; i < rawLines.length; i++) {
          if (rawLines[i].trim()) opStartIdx.push(i);
        }
      }

      for (let k = 0; k < opStartIdx.length; k++) {
        const start = opStartIdx[k];
        const end =
          k + 1 < opStartIdx.length ? opStartIdx[k + 1] : rawLines.length;
        const chunkLines = rawLines.slice(start, end);
        const header = (chunkLines[0] || "").trim();
        const rest = chunkLines.slice(1).join("\n").trim();

        const m = header.match(sr);
        if (!m) {
          cls.operations.push({ raw: chunkLines.join("\n").trim() });
          continue;
        }

        let fullName = m[1] || "";
        let classQualifier = null;
        let opName = fullName;
        if (fullName.includes("::")) {
          const parts = fullName.split("::");
          classQualifier = parts[0];
          opName = parts.slice(1).join("::");
        }

        const signature = (m[2] || "").trim();
        const returnType = m[3] ? m[3].trim() : null;
        const inlineBody = m[4] !== undefined ? String(m[4]).trim() : null;

        let body = null;
        if (inlineBody && inlineBody.length) {
          body = inlineBody;
          if (rest) body += "\n" + rest;
        } else if (rest) {
          body = rest;
        }

        const opObj = {
          name: opName,
          fullName,
          class: classQualifier,
          signature,
          returnType,
        };
        if (body) opObj.body = body;

        const isQueryOp =
          (!!inlineBody && inlineBody.length) ||
          (body && /^\s*if\b/i.test(body));
        if (isQueryOp) cls.query_operations.push(opObj);
        else cls.operations.push(opObj);
      }
    }

    res.classes.push(cls);
  }

  // Associations
  const assocRe =
    /(?:association|aggregation|composition|associationclass)\s+(\w+)\s+between([\s\S]*?)end/gi;
  let am;
  while ((am = assocRe.exec(content)) !== null) {
    const fullMatch = am[0];
    let type = "association";
    const typeMatch = fullMatch.match(
      /^(association|aggregation|composition)\s+/i
    );
    if (typeMatch) type = typeMatch[1].toLowerCase();
    else if (fullMatch.match(/^associationclass\s+/i))
      type = "associationclass";
    const name = am[1];
    const body = am[2] || "";

    const rawLines = body.split(/\r?\n/);
    const lines = rawLines.map((l) => l.trim());
    const parts = [];
    const assocAttributes = [];
    const assocOperations = [];
    const assocQueryOperations = [];
    let mode = "parts";

    for (const line of lines) {
      if (!line) continue;
      const l = line.trim();
      const lower = l.toLowerCase();
      if (lower === "attributes") {
        mode = "attributes";
        continue;
      }
      if (lower === "operations") {
        mode = "operations";
        continue;
      }

      if (mode === "parts") {
        const m = l.match(
          /([A-Za-z0-9_]+)\s*\[([^\]]+)\](?:\s+role\s+([A-Za-z0-9_]+))?/i
        );
        if (m) {
          const part = {
            class: m[1],
            multiplicity: m[2].trim(),
            role: m[3] || m[1].toLowerCase(),
          };
          if (/\b(composition|composite)\b/i.test(l)) part.kind = "composition";
          else if (/\b(aggregation)\b/i.test(l)) part.kind = "aggregation";
          parts.push(part);
        } else {
          const m2 = l.match(/([A-Za-z0-9_]+)(?:\s+role\s+([A-Za-z0-9_]+))?/i);
          if (m2)
            parts.push({
              class: m2[1],
              multiplicity: null,
              role: m2[2] || m2[1].toLowerCase(),
            });
        }
      } else if (mode === "attributes") {
        const amatch = l.match(/^([a-zA-Z0-9_]+)\s*:\s*(.+)$/);
        if (amatch)
          assocAttributes.push({ name: amatch[1], type: amatch[2].trim() });
      } else if (mode === "operations") {
        // allow inline '=' bodies in association operations too
        const om = l.match(
          /^([a-zA-Z0-9_:]+)\s*\(([^)]*)\)\s*(?::\s*([^=\n]+))?\s*(?:=\s*(.*))?$/
        );
        if (om) {
          const fullName = om[1];
          const sig = (om[2] || "").trim();
          const ret = om[3] ? om[3].trim() : null;
          const inline = om[4] !== undefined ? String(om[4]).trim() : null;
          const opObj = { name: fullName, signature: sig, returnType: ret };
          if (inline) opObj.body = inline;
          const isQueryOp =
            (!!inline && inline.length) ||
            (opObj.body && /^\s*if\b/i.test(opObj.body));
          if (isQueryOp) assocQueryOperations.push(opObj);
          else assocOperations.push(opObj);
        } else {
          assocOperations.push({ raw: l });
        }
      }
    }

    const assocObj = { name, parts, type };
    if (type === "associationclass") {
      if (assocAttributes.length) assocObj.attributes = assocAttributes;
      if (assocOperations.length) assocObj.operations = assocOperations;
      if (assocQueryOperations.length)
        assocObj.query_operations = assocQueryOperations;
    }
    res.associations.push(assocObj);
  }

  return res;
}

// Attach extracted conditionals to parsed output
function extractConditionals(content) {
  const found = [];
  if (!content || typeof content !== "string") return found;
  const ifRe =
    /if\s*\(([^)]+)\)\s*then\s*([\s\S]*?)(?:\s*else\s*([\s\S]*?))?(?=\n\s*\n|\nend\b|$)/gim;
  let im;
  while ((im = ifRe.exec(content)) !== null) {
    found.push({
      condition: im[1].trim(),
      then: im[2].trim(),
      else: im[3] ? im[3].trim() : null,
      raw: im[0].trim(),
    });
  }
  return found;
}

function parseUseContentWithConditionals(content) {
  const parsed = parseUseContent(content);
  parsed.conditionals = extractConditionals(content);
  return parsed;
}

function parseCliOutput(cliOut) {
  const idx = cliOut.search(/\n?model\s+/i);
  const payload = idx >= 0 ? cliOut.slice(idx) : cliOut;
  return parseUseContentWithConditionals(payload);
}

// Extract the first concise CLI error message from stderr/stdout
function extractFirstCliError(stderrText, stdoutText) {
  const stderrPart = String(stderrText || "");
  const stdoutPart = String(stdoutText || "");
  const combined = (stderrPart + "\n" + stdoutPart).replace(/\r/g, "\n");

  let m = combined.match(
    /(?:line\s*)?\s*(\d+)\s*[:.,]\s*(\d+)\s*[:\s-]([^\n\r]*)/i
  );
  if (m) return `${m[1]}:${m[2]}: ${m[3].trim()}`;

  m = combined.match(/(?:line\s*)?(\d+):(\d+)[:\s]([^\n\r]*)/i);
  if (m) return `${m[1]}:${m[2]}: ${m[3].trim()}`;

  m = combined.match(/(no viable alternative[^\n\r]*)/i);
  if (m) return m[1].trim();
  m = combined.match(/(error[^\n\r]*)/i);
  if (m) return m[1].trim();

  return null;
}

module.exports = {
  parseUseContent,
  parseUseContentWithConditionals,
  extractConditionals,
  parseCliOutput,
  extractFirstCliError,
};
