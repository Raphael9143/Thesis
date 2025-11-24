// parseUse.js - helpers to parse .use content and extract CLI-style errors

function parseUseContent(content) {
  const res = {
    model: null,
    enums: [],
    classes: [],
    associations: [],
    constraints: [],
  };
  if (!content || typeof content !== "string") return res;

  // Model name
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

  // Classes
  const classBlockRe =
    /^\s*(?:abstract\s+)?class\s+[A-Za-z0-9_][\s\S]*?^end\b/gim;
  let cb;
  while ((cb = classBlockRe.exec(content)) !== null) {
    const block = cb[0];

    const headerMatch = block.match(/^\s*(abstract\s+)?class\s+([^\r\n]+)/im);
    let name = "Unknown";
    let isAbstract = false;
    let superclasses = [];
    if (headerMatch) {
      isAbstract = Boolean(headerMatch[1]);
      const after = headerMatch[2].trim();
      const nm = after.match(/^([A-Za-z0-9_]+)/);
      if (nm) name = nm[1];
      const gen = after.match(/<\s*([^\n]+)/);
      if (gen)
        superclasses = gen[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    }

    const cls = {
      name,
      isAbstract,
      superclasses,
      attributes: [],
      operations: [],
      query_operations: [],
    };

    // attributes
    const attrMatch = block.match(
      /attributes\s*([\s\S]*?)(?:operations\b|\n\s*end\b)/im
    );
    if (attrMatch) {
      const lines = (attrMatch[1] || "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (const line of lines) {
        const m = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)$/);
        if (m) cls.attributes.push({ name: m[1], type: m[2].trim() });
      }
    }

    // operations - capture until a class-level 'end' at the start of a line
    const opMatch = block.match(/operations\s*([\s\S]*?)(?=\n^end\b)/im);
    if (opMatch) {
      const rawLines = (opMatch[1] || "").split(/\r?\n/);
      const sigRe =
        /^\s*([A-Za-z0-9_:]+)\s*\(([^)]*)\)\s*(?::\s*([^=\n]+))?\s*(?:=\s*(.*))?$/;
      const reserved = /^(?:if|let|collect|select|reject|forAll|exists|closure|then|else|endif)\b/i;
      const starts = [];
      for (let i = 0; i < rawLines.length; i++) {
        const t = rawLines[i].trim();
        if (!t) continue;
        if (sigRe.test(t) && !reserved.test(t)) starts.push(i);
      }
      if (!starts.length) {
        for (let i = 0; i < rawLines.length; i++)
          if (rawLines[i].trim()) starts.push(i);
      }
      for (let k = 0; k < starts.length; k++) {
        const s = starts[k];
        const e = k + 1 < starts.length ? starts[k + 1] : rawLines.length;
        const chunk = rawLines.slice(s, e);
        const header = (chunk[0] || "").trim();
        const rest = chunk.slice(1).join("\n").trim();
        const m = header.match(sigRe);
        if (!m) {
          cls.operations.push({ raw: chunk.join("\n").trim() });
          continue;
        }
        let full = m[1] || "";
        let classQ = null;
        let opName = full;
        if (full.includes("::")) {
          const parts = full.split("::");
          classQ = parts[0];
          opName = parts.slice(1).join("::");
        }
        const signature = (m[2] || "").trim();
        const returnType = m[3] ? m[3].trim() : null;
        const inline = m[4] !== undefined ? String(m[4]).trim() : null;
        const headerHasEq = /=/.test(header);
        let body = null;
        if (inline && inline.length) {
          body = inline;
          if (rest) body += "\n" + rest;
        } else if (rest) body = rest;
        const opObj = {
          name: opName,
          fullName: full,
          class: classQ,
          signature,
          returnType,
        };
        if (body) opObj.body = body;
        // Heuristic: treat as query if inline body present OR body looks like an
        // expression (starts with '(' or 'if', contains OCL navigation '->', or
        // is a short single-line expression). Avoid treating imperative blocks
        // (begin/declare/insert/for/result assignments) as queries.
        const looksLikeQuery = (b, inl) => {
          if (inl) return true;
          if (!b || !String(b).trim()) return false;
          const s = String(b).trim();
          // avoid imperative/multi-line bodies first
          if (/^\s*begin\b/i.test(s)) return false;
          if (/\bdeclare\b|\binsert\b|\bfor\b|:=|\bresult\b/i.test(s))
            return false;
          // now check for expression-like bodies
          if (/^\s*if\b/i.test(s)) return true;
          if (/^\s*\(/.test(s)) return true;
          if (/->/.test(s)) return true;
          // single-line (no newline) expressions are likely queries
          if (!/\r?\n/.test(s)) return true;
          return false;
        };
        const isQuery = looksLikeQuery(body, inline || headerHasEq);
        if (isQuery) cls.query_operations.push(opObj);
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
    const full = am[0];
    let type = "association";
    const tm = full.match(/^(association|aggregation|composition)\s+/i);
    if (tm) type = tm[1].toLowerCase();
    else if (/^associationclass\s+/i.test(full)) type = "associationclass";
    const name = am[1];
    const body = am[2] || "";
    const lines = body.split(/\r?\n/).map((l) => l.trim());
    const parts = [];
    const attributes = [];
    const operations = [];
    const query_operations = [];
    let mode = "parts";
    for (const l of lines) {
      if (!l) continue;
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
          const p = {
            class: m[1],
            multiplicity: m[2].trim(),
            // role is optional in USE syntax — do not invent a role name when missing
            role: m[3] || null,
          };
          if (/\b(composition|composite)\b/i.test(l)) p.kind = "composition";
          else if (/\b(aggregation)\b/i.test(l)) p.kind = "aggregation";
          parts.push(p);
        } else {
          const m2 = l.match(/([A-Za-z0-9_]+)(?:\s+role\s+([A-Za-z0-9_]+))?/i);
          if (m2)
            parts.push({ class: m2[1], multiplicity: null, role: m2[2] || null });
        }
        // attributes handled in 'attributes' mode above
      } else if (mode === "operations") {
        const om = l.match(
          /^([A-Za-z0-9_:]+)\s*\(([^)]*)\)\s*(?::\s*([^=\n]+))?\s*(?:=\s*(.*))?$/
        );
        if (om) {
          const fulln = om[1];
          const sig = (om[2] || "").trim();
          const ret = om[3] ? om[3].trim() : null;
          const inline = om[4] !== undefined ? String(om[4]).trim() : null;
          const headerHasEq = /=/.test(l);
          const op = { name: fulln, signature: sig, returnType: ret };
          if (inline) op.body = inline;
          // Heuristic similar to class-level operations
          const looksLikeQuery = (b, inl) => {
            if (inl) return true;
            if (!b || !String(b).trim()) return false;
            const s = String(b).trim();
            // avoid imperative/multi-line bodies first
            if (/^\s*begin\b/i.test(s)) return false;
            if (/\bdeclare\b|\binsert\b|\bfor\b|:=|\bresult\b/i.test(s))
              return false;
            // expression-like checks
            if (/^\s*if\b/i.test(s)) return true;
            if (/^\s*\(/.test(s)) return true;
            if (/->/.test(s)) return true;
            if (!/\r?\n/.test(s)) return true;
            return false;
          };
          const isQ = looksLikeQuery(op.body, inline || headerHasEq);
          if (isQ) query_operations.push(op);
          else operations.push(op);
        } else operations.push({ raw: l });
      }
    }
    const obj = { name, parts, type };
    if (type === "associationclass") {
      if (attributes.length) obj.attributes = attributes;
      if (operations.length) obj.operations = operations;
      if (query_operations.length) obj.query_operations = query_operations;
    }
    res.associations.push(obj);
  }

  // Constraints: find context blocks and standalone op specs with pre/post
  try {
    // find 'context' headers
    const ctxHdrRe = /context\s+([^\r\n]+)/gim;
    let mHdr;
    while ((mHdr = ctxHdrRe.exec(content)) !== null) {
      const header = mHdr[1].trim();
      // determine the following block (lines until blank line or next context)
      const lineEnd = content.indexOf("\n", mHdr.index);
      const blockStart =
        lineEnd >= 0 ? lineEnd + 1 : mHdr.index + mHdr[0].length;
      // find next double newline or next 'context' occurrence
      const nextBlank = content.indexOf("\n\n", blockStart);
      const nextCtxRel = content.slice(blockStart).search(/\n\s*context\b/i);
      let blockEnd = content.length;
      if (nextBlank >= 0 && nextCtxRel >= 0)
        blockEnd =
          blockStart + Math.min(nextBlank - blockStart + 2, nextCtxRel);
      else if (nextBlank >= 0) blockEnd = nextBlank + 2;
      else if (nextCtxRel >= 0) blockEnd = blockStart + nextCtxRel;
      const block = content.slice(blockStart, blockEnd).trim();

      // header might include 'inv name:' (e.g. "BuyTicket inv name:")
      const hdrInv = header.match(
        /^(.*?)\s+inv\s+([A-Za-z0-9_]+)\s*:\s*(.*)$/i
      );
      if (hdrInv) {
        const ctxName = hdrInv[1].trim();
        const invName = hdrInv[2];
        const invExpr = (hdrInv[3] || "").trim();
        if (invExpr)
          res.constraints.push({
            context: ctxName,
            type: "invariant",
            name: invName,
            expression: invExpr,
            raw: `inv ${invName}: ${invExpr}`,
          });
        else if (block)
          res.constraints.push({
            context: ctxName,
            type: "invariant",
            name: invName,
            expression: block,
            raw: block,
          });
      }

      // find inv lines in block
      const invRe =
        /inv\s+([A-Za-z0-9_]+)\s*:\s*([\s\S]*?)(?=(?:\r?\n)\s*inv\b|$)/gim;
      let im2;
      while ((im2 = invRe.exec(block)) !== null) {
        const name = im2[1];
        const expr = (im2[2] || "").trim();
        res.constraints.push({
          context: header.replace(/\s+inv\b[\s\S]*/i, "").trim(),
          type: "invariant",
          name,
          expression: expr,
          raw: im2[0].trim(),
        });
      }

      // pre/post in block
      const ppRe =
        /(^|\n)\s*(pre|post)\s+([A-Za-z0-9_]+)\s*:\s*([\s\S]*?)(?=(?:\r?\n)\s*(pre|post)\b|$)/gim;
      let ppm;
      while ((ppm = ppRe.exec(block)) !== null) {
        res.constraints.push({
          context: header.replace(/\s+inv\b[\s\S]*/i, "").trim(),
          type:
            ppm[2].toLowerCase() === "pre" ? "precondition" : "postcondition",
          name: ppm[3],
          expression: (ppm[4] || "").trim(),
          raw: ppm[0].trim(),
        });
      }
    }

    // standalone op signatures (without leading 'context') followed by indented pre/post
    const opSigRe =
      // eslint-disable-next-line no-useless-escape
      /^([A-Za-z0-9_:\.]+::[A-Za-z0-9_]+\s*\([^\)]*\)\s*:\s*[A-Za-z0-9_]+)\s*$/gim;
    let sgm;
    while ((sgm = opSigRe.exec(content)) !== null) {
      const sig = sgm[1].trim();
      const start = sgm.index + sgm[0].length;
      const rest = content.slice(start);
      const fm = /^([ \t]+[^\r\n]+(?:\r?\n|$))+/m.exec(rest);
      if (!fm) continue;
      const block = fm[0];
      const pp =
        // eslint-disable-next-line max-len
        /(?:^|\n)\s*(pre|post)\s+([A-Za-z0-9_]+)\s*:\s*([\s\S]*?)(?=(?:\r?\n)\s*(pre|post)\b|\r?\n\s*\r?\n|$)/gim;
      let p2;
      while ((p2 = pp.exec(block)) !== null) {
        res.constraints.push({
          context: sig,
          type:
            p2[1].toLowerCase() === "pre" ? "precondition" : "postcondition",
          name: p2[2],
          expression: (p2[3] || "").trim(),
          raw: p2[0].trim(),
        });
      }
    }
  } catch (e) {
    console.error("Error parsing constraints:", e);
  }

  return res;
}

// conditionals extraction
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
