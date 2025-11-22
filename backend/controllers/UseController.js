const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Import the parseAssociationText and parseClassText utility functions
const parseAssociationText = require("../utils/parseAssociationText");
const parseClassText = require("../utils/parseClassText");

// Path to the bundled USE CLI batch
const USE_BIN = path.resolve(__dirname, "..", "use-7.5.0", "bin");
const USE_BATCH = path.join(USE_BIN, "use.bat");

function runUseCli(filePath, timeout = 5000) {
  return new Promise((resolve, reject) => {
    let proc = null;
    const spawnUse = () => {
      try {
        // Use shell to allow PATH lookup for `use` command
        return spawn("use", [], { shell: true });
      } catch (e) {
        console.error("Error spawning USE CLI:", e);
        return null;
      }
    };
    const spawnBatch = () => {
      if (!fs.existsSync(USE_BATCH)) return null;
      try {
        return spawn(USE_BATCH, [], { cwd: USE_BIN, shell: true });
      } catch (e) {
        console.error("Error spawning USE CLI batch:", e);
        return null;
      }
    };

    proc = spawnUse() || spawnBatch();
    if (!proc) return reject(new Error("USE CLI not found"));

    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      try {
        proc.kill();
      } catch (e) {
        console.error("Error killing USE CLI process:", e);
      }
      reject(new Error("USE CLI timed out"));
    }, timeout);

    proc.stdout.on("data", (d) => {
      out += d.toString();
    });
    proc.stderr.on("data", (d) => {
      err += d.toString();
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      try {
        let finalOut = out;

        // Prefer the segment that starts at a 'use>' prompt immediately
        // followed by the model output (e.g. "use> model ..."). This
        // looks for patterns like: "use> info model" or "use> model".
        const useModelRe = /use>\s*(?:info\s+model\s*)?model\s+/i;
        const m = finalOut.match(useModelRe);
        if (m && m.index != null) {
          // compute index of the 'model' keyword inside the match
          const inner = m[0].match(/model\s+/i);
          const modelOffsetInMatch = inner ? m[0].indexOf(inner[0]) : 0;
          const modelIdx = m.index + modelOffsetInMatch;
          finalOut = finalOut.slice(modelIdx);
        } else {
          // fallback: start at the first 'model' occurrence
          const idx = finalOut.search(/\n?model\s+/i);
          if (idx >= 0) finalOut = finalOut.slice(idx);
        }

        // Remove trailing 'use>' prompt if present at the end
        finalOut = finalOut.replace(/\s*use>\s*$/i, "");

        // Drop the last two lines of the returned log as requested
        const lines = finalOut.split(/\r?\n/);
        if (lines.length > 2) {
          lines.splice(-2, 2);
          finalOut = lines.join("\r\n");
        }

        return resolve({ code, stdout: finalOut, stderr: err });
      } catch {
        // on any error, return the raw output as a safe fallback
        return resolve({ code, stdout: out, stderr: err });
      }
    });

    // Send commands to the USE process: open <file>, then info model, then quit
    // Ensure file path quoting works across shells
    const openCmd = `open "${filePath.replace(/"/g, '\\"')}"\n`;
    proc.stdin.write(openCmd);
    proc.stdin.write("info model\n");
    proc.stdin.write("quit\n");
    proc.stdin.end();
  });
}

function parseUseContent(content) {
  const res = { model: null, enums: [], classes: [], associations: [] };

  const modelMatch = content.match(/model\s+(\w+)/i);
  if (modelMatch) res.model = modelMatch[1];

  // Enums
  const enumRe = /enum\s+(\w+)\s*\{([\s\S]*?)\}/gi;
  let em;
  while ((em = enumRe.exec(content)) !== null) {
    const name = em[1];
    const body = em[2];
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

    // extract the header line (first line that contains 'class')
    const headerMatch = block.match(/^\s*(abstract\s+)?class\s+([^\r\n]+)/im);
    let name = "Unknown";
    let isAbstract = false;
    let superclasses = [];
    if (headerMatch) {
      isAbstract = Boolean(headerMatch[1]);
      const afterClass = headerMatch[2].trim();
      // afterClass may contain: "Name < Super1, Super2" or "Name"
      const nameOnlyMatch = afterClass.match(/^([A-Za-z0-9_]+)/);
      if (nameOnlyMatch) name = nameOnlyMatch[1];

      const genMatch = afterClass.match(/<\s*([^\n]+)/);
      if (genMatch) {
        const list = genMatch[1]
          .split(/,/) // multiple inheritance separated by commas
          .map((s) => s.trim())
          .filter(Boolean);
        superclasses = list;
      }
    }

    const cls = {
      name,
      isAbstract,
      superclasses,
      attributes: [],
      operations: [],
    };

    // attributes block within class
    const attrMatch = block.match(
      /attributes\s*([\s\S]*?)(?:operations\b|\n\s*end\b)/im
    );
    if (attrMatch) {
      const attrBody = attrMatch[1];
      const lines = attrBody
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (const line of lines) {
        // match 'name : Type' (capture the full type portion up to line end)
        const m = line.match(/^([a-zA-Z0-9_]+)\s*:\s*([^\r\n]+)\s*$/);
        if (m) cls.attributes.push({ name: m[1], type: m[2] });
      }
    }

    // operations block within class -- capture multi-line bodies and query-style '=' bodies
    const opMatch = block.match(/operations\s*([\s\S]*?)(?=\n\s*end\b)/im);
    if (opMatch) {
      const opBody = opMatch[1];
      const rawLines = opBody.split(/\r?\n/);

      // Identify indices that start a new operation (lines that look like a signature)
      const sr = /^\s*([A-Za-z0-9_:]+)\s*\(([^)]*)\)\s*(?::\s*([^=\n]+))?\s*(?:=\s*(.*))?$/;
      const opStartIdx = [];
      for (let i = 0; i < rawLines.length; i++) {
        const t = rawLines[i].trim();
        if (!t) continue;
        if (sr.test(t)) opStartIdx.push(i);
      }

      // If none matched, try to treat every non-empty line as an operation line
      if (!opStartIdx.length) {
        for (let i = 0; i < rawLines.length; i++) {
          if (rawLines[i].trim()) opStartIdx.push(i);
        }
      }

      // Group lines into operation chunks
      for (let k = 0; k < opStartIdx.length; k++) {
        const start = opStartIdx[k];
        const end =
          k + 1 < opStartIdx.length ? opStartIdx[k + 1] : rawLines.length;
        const chunkLines = rawLines.slice(start, end);
        const header = (chunkLines[0] || "").trim();
        const rest = chunkLines.slice(1).join("\n").trim();

        const m = header.match(sr);
        if (!m) {
          // fallback: push raw line
          cls.operations.push({ raw: chunkLines.join("\n").trim() });
          continue;
        }

        // name may include Class::op, so split
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
          // entire body provided inline after '=' on same header line
          body = inlineBody + (rest ? "\n" + rest : "");
        } else if (rest) {
          // If rest begins with 'begin', keep everything including begin/end
          body = rest;
        } else {
          // no body
          body = null;
        }

        const opObj = {
          name: opName,
          fullName: fullName,
          class: classQualifier,
          signature,
          returnType,
        };
        if (body) opObj.body = body;
        cls.operations.push(opObj);
      }
    }

    res.classes.push(cls);
  }

  // Associations (supports 'association', 'aggregation', 'composition', 'associationclass')
  const assocRe =
    /(?:association|aggregation|composition|associationclass)\s+(\w+)\s+between([\s\S]*?)end/gi;
  let am;
  while ((am = assocRe.exec(content)) !== null) {
    // Determine the keyword (type) by inspecting the matched substring
    const fullMatch = am[0];
    let type = "association";
    const typeMatch = fullMatch.match(
      /^(association|aggregation|composition)\s+/i
    );
    if (typeMatch) type = typeMatch[1].toLowerCase();
    else {
      const acMatch = fullMatch.match(/^associationclass\s+/i);
      if (acMatch) type = "associationclass";
    }
    const name = am[1];
    const body = am[2];
    // split body into raw lines and walk by index to support multi-line operation bodies
    const rawLines = body.split(/\r?\n/);
    const lines = rawLines.map((l) => l.trim());
    const parts = [];
    const assocAttributes = [];
    const assocOperations = [];
    let mode = "parts"; // switch to 'attributes' or 'operations' when encountered

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const l = line.trim();
      const lower = l.toLowerCase();
      if (lower === "attributes") {
        mode = "attributes";
        continue;
      }
      if (lower === "operations") {
        mode = "operations";
        // gather rest of lines as the operations block
        const opsLines = lines.slice(i + 1);
        // group into operation chunks similar to class parsing
        const sigRe =
          /^\s*([A-Za-z0-9_:]+)\s*\(([^)]*)\)\s*(?::\s*([^=\n]+))?\s*(?:=\s*(.*))?$/;
        const opStartIdx = [];
        for (let j = 0; j < opsLines.length; j++) {
          if (!opsLines[j] || !opsLines[j].trim()) continue;
          if (sigRe.test(opsLines[j].trim())) opStartIdx.push(j);
        }
        if (!opStartIdx.length) {
          for (let j = 0; j < opsLines.length; j++) {
            if (opsLines[j] && opsLines[j].trim()) opStartIdx.push(j);
          }
        }
        for (let k = 0; k < opStartIdx.length; k++) {
          const start = opStartIdx[k];
          const end =
            k + 1 < opStartIdx.length ? opStartIdx[k + 1] : opsLines.length;
          const chunk = opsLines.slice(start, end);
          const header = (chunk[0] || "").trim();
          const rest = chunk.slice(1).join("\n").trim();
          const m = header.match(sigRe);
          if (!m) {
            assocOperations.push({ raw: chunk.join("\n").trim() });
            continue;
          }
          let fullName = m[1] || "";
          let classQualifier = null;
          let opName = fullName;
          if (fullName.includes("::")) {
            const partsQ = fullName.split("::");
            classQualifier = partsQ[0];
            opName = partsQ.slice(1).join("::");
          }
          const signature = (m[2] || "").trim();
          const returnType = m[3] ? m[3].trim() : null;
          const inlineBody = m[4] !== undefined ? String(m[4]).trim() : null;
          let bodyText = null;
          if (inlineBody && inlineBody.length)
            bodyText = inlineBody + (rest ? "\n" + rest : "");
          else if (rest) bodyText = rest;
          const opObj = {
            name: opName,
            fullName,
            class: classQualifier,
            signature,
            returnType,
          };
          if (bodyText) opObj.body = bodyText;
          assocOperations.push(opObj);
        }
        // we've consumed the rest of the operations block; break out of the loop
        break;
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
          if (m2) {
            const pObj = {
              class: m2[1],
              multiplicity: null,
              role: m2[2] || m2[1].toLowerCase(),
            };
            parts.push(pObj);
          }
        }
      } else if (mode === "attributes") {
        const amatch = l.match(/^([a-zA-Z0-9_]+)\s*:\s*(.+)$/);
        if (amatch)
          assocAttributes.push({ name: amatch[1], type: amatch[2].trim() });
      }
    }

    const assocObj = { name, parts, type };
    if (type === "associationclass") {
      if (assocAttributes.length) assocObj.attributes = assocAttributes;
      if (assocOperations.length) assocObj.operations = assocOperations;
    }
    res.associations.push(assocObj);
  }

  return res;
}

// Attach extracted conditionals to parsed output
// so the helper `extractConditionals` is actually used.
function parseUseContentWithConditionals(content) {
  const parsed = parseUseContent(content);
  parsed.conditionals = extractConditionals(content);
  return parsed;
}

// Extract the first concise CLI error message from stderr/stdout and
// normalize it to the form 'line:col: Message'. Returns null when none.
function extractFirstCliError(stderrText, stdoutText) {
  const stderrPart = String(stderrText || "");
  const stdoutPart = String(stdoutText || "");
  const combined = (stderrPart + "\n" + stdoutPart).replace(/\r/g, "\n");

  // Prefer explicit column-style messages like `49:17: ...` or `line 49:17: ...`
  let m = combined.match(
    /(?:line\s*)?\s*(\d+)\s*[:.,]\s*(\d+)\s*[:\s-]([^\n\r]*)/i
  );
  if (m) return `${m[1]}:${m[2]}: ${m[3].trim()}`;

  m = combined.match(/(?:line\s*)?(\d+):(\d+)[:\s]([^\n\r]*)/i);
  if (m) return `${m[1]}:${m[2]}: ${m[3].trim()}`;

  // fallback to other known messages
  m = combined.match(/(no viable alternative[^\n\r]*)/i);
  if (m) return m[1].trim();
  m = combined.match(/(error[^\n\r]*)/i);
  if (m) return m[1].trim();

  return null;
}

// Extract simple if-then-else blocks from raw content
// (returns array of {condition, then, else, raw})
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

function parseCliOutput(cliOut) {
  const idx = cliOut.search(/\n?model\s+/i);
  const payload = idx >= 0 ? cliOut.slice(idx) : cliOut;
  // Reuse parseUseContent on the cleaned payload
  return parseUseContentWithConditionals(payload);
}

// Parse a single operation line like `deposit(amount : Real) : Void`
function parseOperationLine(line) {
  if (!line || typeof line !== "string") return null;
  const l = line.trim();
  // match name(params) : ReturnType  (returnType optional)
  const m = l.match(/^([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*(?::\s*(.+))?$/);
  if (!m) return null;
  return {
    name: m[1],
    signature: (m[2] || "").trim(),
    returnType: m[3] ? m[3].trim() : null,
  };
}

/**
 * Build a .use file text from a JSON model object.
 * Expected shape: { model, enums, classes, associations, constraints }
 */
function buildUseText(modelJson) {
  if (!modelJson || typeof modelJson !== "object") return "";
  const lines = [];
  const modelName = modelJson.model || modelJson.name || "Model1";
  lines.push(`model ${modelName}`);
  lines.push("");

  // Enums
  if (Array.isArray(modelJson.enums)) {
    for (const en of modelJson.enums) {
      const name = en.name || "Enum";
      const vals = Array.isArray(en.values)
        ? en.values
        : String(en.values || "")
            .split(/,/)
            .map((s) => s.trim())
            .filter(Boolean);
      lines.push(`enum ${name} { ${vals.join(", ")} }`);
      lines.push("");
    }
  }

  // Classes
  if (Array.isArray(modelJson.classes)) {
    for (const cls of modelJson.classes) {
      const parts = [];
      if (cls.isAbstract) parts.push("abstract");
      let header = `class ${cls.name || "Unnamed"}`;
      if (Array.isArray(cls.superclasses) && cls.superclasses.length) {
        header += ` < ${cls.superclasses.join(", ")}`;
      }
      if (parts.length) header = parts.join(" ") + " " + header;
      lines.push(header);

      if (Array.isArray(cls.attributes) && cls.attributes.length) {
        lines.push("  attributes");
        for (const a of cls.attributes) {
          const t = a.type ? ` : ${a.type}` : "";
          lines.push(`    ${a.name || "unnamed"}${t}`);
        }
      }

      if (Array.isArray(cls.operations) && cls.operations.length) {
        lines.push("  operations");
        for (const op of cls.operations) {
          const sig = op.signature !== undefined ? `(${op.signature})` : "()";
          lines.push(`    ${op.name || "op"}${sig}`);
        }
      }

      lines.push("end");
      lines.push("");
    }
  }

  // Associations
  // Associations
  if (Array.isArray(modelJson.associations)) {
    for (const assoc of modelJson.associations) {
      const type = assoc.type || "association";
      const keyword =
        type === "aggregation"
          ? "aggregation"
          : type === "composition"
            ? "composition"
            : type === "associationclass"
              ? "associationclass"
              : "association";

      lines.push(`${keyword} ${assoc.name || "Assoc"} between`);

      if (Array.isArray(assoc.parts)) {
        for (const p of assoc.parts) {
          const mult = p.multiplicity ? `[${p.multiplicity}]` : "";
          const role = p.role ? ` role ${p.role}` : "";
          lines.push(`  ${p.class || "Unnamed"} ${mult}${role}`);
        }
      }

      // associationclass can have attributes and operations inside
      if (type === "associationclass") {
        if (Array.isArray(assoc.attributes) && assoc.attributes.length) {
          lines.push("  attributes");
          for (const a of assoc.attributes) {
            const t = a.type ? ` : ${a.type}` : "";
            lines.push(`    ${a.name || "unnamed"}${t}`);
          }
        }

        if (Array.isArray(assoc.operations) && assoc.operations.length) {
          lines.push("  operations");
          for (const op of assoc.operations) {
            if (op.signature !== undefined) {
              const sig = `(${op.signature})`;
              const ret = op.returnType ? ` : ${op.returnType}` : "";
              lines.push(`    ${op.name || "op"}${sig}${ret}`);
            } else if (op.raw) {
              lines.push(`    ${op.raw}`);
            }
          }
        }
      }

      lines.push("end");
      lines.push("");
    }
  }

  // Constraints (simple pass-through if provided as array of strings)
  if (Array.isArray(modelJson.constraints) && modelJson.constraints.length) {
    lines.push("constraints");
    for (const c of modelJson.constraints) {
      if (typeof c === "string") lines.push(c);
      else if (c && c.raw) lines.push(c.raw);
      else if (c && c.expression) lines.push(c.expression);
    }
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Build a single class `.use` text from a class JSON object.
 * Expected shape: { name, isAbstract, superclasses, attributes, operations }
 */
function buildClassText(cls) {
  if (!cls || typeof cls !== "object") return "";
  const lines = [];
  const parts = [];
  if (cls.isAbstract) parts.push("abstract");
  let header = `class ${cls.name || "Unnamed"}`;
  if (Array.isArray(cls.superclasses) && cls.superclasses.length) {
    header += ` < ${cls.superclasses.join(", ")}`;
  }
  if (parts.length) header = parts.join(" ") + " " + header;
  lines.push(header);

  if (Array.isArray(cls.attributes) && cls.attributes.length) {
    lines.push("  attributes");
    for (const a of cls.attributes) {
      // accept {name,type} or string like 'x : Type'
      if (typeof a === "string") {
        lines.push("    " + a);
      } else if (a && typeof a === "object") {
        const t = a.type ? ` : ${a.type}` : "";
        lines.push(`    ${a.name || "unnamed"}${t}`);
      }
    }
  }

  if (Array.isArray(cls.operations) && cls.operations.length) {
    lines.push("  operations");
    for (const op of cls.operations) {
      if (typeof op === "string") {
        lines.push("    " + op);
      } else if (op && typeof op === "object") {
        const sig = op.signature !== undefined ? `(${op.signature})` : "()";
        lines.push(`    ${op.name || "op"}${sig}`);
      }
    }
  }

  lines.push("end");
  return lines.join("\n");
}

/**
 * Build a single association `.use` text from an association JSON object.
 * Expected shape: { name, parts, type }
 */
function buildAssociationText(assoc) {
  if (!assoc || typeof assoc !== "object") return "";

  const type = assoc.type || "association";
  const keyword =
    type === "aggregation"
      ? "aggregation"
      : type === "composition"
        ? "composition"
        : type === "associationclass"
          ? "associationclass"
          : "association";

  const lines = [`${keyword} ${assoc.name || "Unnamed"} between`];

  if (Array.isArray(assoc.parts)) {
    for (const part of assoc.parts) {
      const mult = part.multiplicity ? `[${part.multiplicity}]` : "";
      const role = part.role ? ` role ${part.role}` : "";
      lines.push(`  ${part.class || "Unnamed"} ${mult}${role}`);
    }
  }

  lines.push("end");
  return lines.join("\n");
}

const UseController = {
  // Get a stored USE model by id with related entities
  getById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!id) {
        return res.status(400).json({ success: false, message: "Invalid id" });
      }

      // Ensure associations
      require("../models/UseAssociations");
      const UseModel = require("../models/UseModel");
      const UseEnum = require("../models/UseEnum");
      const UseClass = require("../models/UseClass");
      const UseAttribute = require("../models/UseAttribute");
      const UseOperation = require("../models/UseOperation");
      const UseAssociation = require("../models/UseAssociation");
      const UseAssociationPart = require("../models/UseAssociationPart");
      const UseConstraint = require("../models/UseConstraint");

      const model = await UseModel.findByPk(id, {
        include: [
          { model: UseEnum, as: "enums" },
          {
            model: UseClass,
            as: "classes",
            include: [
              { model: UseAttribute, as: "attributes" },
              { model: UseOperation, as: "operations" },
            ],
          },
          {
            model: UseAssociation,
            as: "associations",
            include: [{ model: UseAssociationPart, as: "parts" }],
          },
          { model: UseConstraint, as: "constraints" },
        ],
      });

      if (!model)
        return res
          .status(404)
          .json({ success: false, message: "Model not found" });

      // Normalize: remove camelCase duplicates when snake_case exists
      const plain = model.get({ plain: true });
      const stripCamelDuplicates = (node) => {
        if (Array.isArray(node)) {
          node.forEach(stripCamelDuplicates);
          return;
        }
        if (!node || typeof node !== "object") return;

        if (
          Object.prototype.hasOwnProperty.call(node, "owner_id") &&
          Object.prototype.hasOwnProperty.call(node, "ownerId")
        ) {
          delete node.ownerId;
        }
        if (
          Object.prototype.hasOwnProperty.call(node, "use_model_id") &&
          Object.prototype.hasOwnProperty.call(node, "useModelId")
        ) {
          delete node.useModelId;
        }
        if (
          Object.prototype.hasOwnProperty.call(node, "use_class_id") &&
          Object.prototype.hasOwnProperty.call(node, "useClassId")
        ) {
          delete node.useClassId;
        }
        if (
          Object.prototype.hasOwnProperty.call(node, "use_association_id") &&
          Object.prototype.hasOwnProperty.call(node, "useAssociationId")
        ) {
          delete node.useAssociationId;
        }

        // Recurse into all object properties
        for (const k of Object.keys(node)) {
          stripCamelDuplicates(node[k]);
        }
      };

      stripCamelDuplicates(plain);
      return res.json({ success: true, data: plain });
    } catch (error) {
      console.error("Get USE model by id error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  listMine: async (req, res) => {
    try {
      if (!req.user || !req.user.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const ownerId = req.user.userId;
      require("../models/UseAssociations");
      const UseModel = require("../models/UseModel");

      const models = await UseModel.findAll({
        where: { owner_id: ownerId },
        order: [["created_at", "DESC"]],
        attributes: [
          "id",
          "name",
          "file_path",
          "owner_id",
          "created_at",
          "updated_at",
        ],
      });

      return res.json({ success: true, data: models });
    } catch (error) {
      console.error("List my USE models error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  parse: async (req, res) => {
    try {
      let filePath = null;
      if (req.file) {
        filePath = path.resolve(req.file.path);
      } else if (req.files && req.files.length) {
        // multer.any() puts files in req.files
        filePath = path.resolve(req.files[0].path);
      } else if (req.body && req.body.path) {
        // Support public-style paths like '/uploads/filename.use' or 'uploads/filename.use'
        // Map them to the project's uploads directory rather than treating a leading
        // slash as an absolute filesystem root path.
        const inputPath = String(req.body.path || "");
        const normalizedInput = inputPath.replace(/\\/g, "/");
        const uploadsMatch = normalizedInput.match(/^\/?uploads\/(.+)/i);
        if (uploadsMatch) {
          // resolve relative to project uploads folder
          filePath = path.resolve(__dirname, "..", "uploads", uploadsMatch[1]);
        } else if (path.isAbsolute(inputPath)) {
          filePath = path.normalize(inputPath);
        } else {
          filePath = path.resolve(inputPath);
        }
      } else {
        return res
          .status(400)
          .json({ success: false, message: "file upload or path required" });
      }

      if (!fs.existsSync(filePath))
        return res
          .status(404)
          .json({ success: false, message: "File not found" });

      // Run USE CLI to validate and inspect the model (best-effort)
      let cliResult = null;
      try {
        cliResult = await runUseCli(filePath, 8000);
      } catch (err) {
        cliResult = { error: err.message };
      }

      const content = fs.readFileSync(filePath, "utf8");

      // Try to parse from CLI output first if available and looks valid
      let parsed = null;
      const stdoutText = (cliResult && cliResult.stdout) || "";
      const stderrText = (cliResult && cliResult.stderr) || "";

      // If CLI produced any stderr or non-zero exit code, treat as a parse error
      const cliHasStdErr = stderrText && String(stderrText).trim().length > 0;
      const cliExitCode =
        cliResult && typeof cliResult.code === "number" ? cliResult.code : null;

      // Allow explicit fallback (for backward compatibility) via query param or body field
      const allowFallback =
        (req.query && String(req.query.fallback).toLowerCase() === "true") ||
        (req.body && req.body.fallback === true);

      if (
        cliResult &&
        (cliHasStdErr || (cliExitCode !== null && cliExitCode !== 0))
      ) {
        if (!allowFallback) {
          const firstErr = extractFirstCliError(stderrText, stdoutText);
          const message = firstErr
            ? firstErr
            : cliResult.error
              ? `USE CLI error: ${cliResult.error}`
              : "USE CLI reported an error";
          return res.status(400).json({ success: false, message });
        }
      }

      // If CLI output looks like a valid model, prefer parsing it
      const hasModelLine = /(^|\n)\s*model\s+[A-Za-z0-9_]+/i.test(stdoutText);
      if (!cliHasStdErr && hasModelLine && cliResult && cliResult.stdout) {
        try {
          parsed = parseCliOutput(cliResult.stdout);
        } catch {
          parsed = null;
        }
      }

      // Fallback to parsing raw file content if CLI isn't available or didn't produce model
      if (!parsed || !parsed.model) {
        parsed = parseUseContentWithConditionals(content);
      }

      // Ensure we always attach conditionals extracted from the raw content
      try {
        if (!parsed.conditionals || !parsed.conditionals.length) {
          parsed.conditionals = extractConditionals(content);
        }
      } catch (e) {
        console.error("Error extracting conditionals:", e);
      }

      // If still no model parsed, return a helpful error using CLI message if present
      if (!parsed || !parsed.model) {
        const firstErr = extractFirstCliError(stderrText, stdoutText);
        const errorMessage = firstErr
          ? firstErr
          : cliResult && cliResult.error
            ? `USE CLI error: ${cliResult.error}`
            : "Invalid .use file. Please fix syntax or model errors.";

        return res.status(400).json({ success: false, message: errorMessage });
      }

      return res.json({ success: true, cli: cliResult, model: parsed });
    } catch (error) {
      console.error("Parse .use error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  exportUml: async (req, res) => {
    try {
      const json = req.body;
      if (!json || typeof json !== "object")
        return res
          .status(400)
          .json({ success: false, message: "JSON UML body required" });

      const useText = buildUseText(json);
      const modelName = (json.model || json.name || "model").replace(
        /[^A-Za-z0-9_-]/g,
        "_"
      );
      const filename = `${modelName}.use`;

      // Validate with USE CLI if requested with ?validate=true
      const wantValidate =
        (req.query && String(req.query.validate).toLowerCase() === "true") ||
        false;
      if (wantValidate) {
        const uploadsDir = path.resolve(__dirname, "..", "uploads");
        if (!fs.existsSync(uploadsDir))
          fs.mkdirSync(uploadsDir, { recursive: true });
        const tmpName = `uml_export_${Date.now()}.use`;
        const tmpPath = path.join(uploadsDir, tmpName);
        fs.writeFileSync(tmpPath, useText, "utf8");
        let cliRes = null;
        try {
          cliRes = await runUseCli(tmpPath, 8000);
        } catch (e) {
          try {
            fs.unlinkSync(tmpPath);
          } catch (err) {
            console.error("Error deleting temp USE file:", err);
          }
          return res
            .status(500)
            .json({ success: false, message: `USE CLI error: ${e.message}` });
        }
        try {
          fs.unlinkSync(tmpPath);
        } catch (err) {
          console.error("Error deleting temp USE file:", err);
        }

        const stderrText = (cliRes && cliRes.stderr) || "";
        const stdoutText = (cliRes && cliRes.stdout) || "";
        if (stderrText && String(stderrText).trim().length > 0) {
          const firstErr = extractFirstCliError(stderrText, stdoutText);
          const message = firstErr || "USE CLI reported errors";
          return res.status(400).json({ success: false, message });
        }
      }

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      return res.send(useText);
    } catch (error) {
      console.error("Export UML error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Serialize a single class JSON into .use class text
  serializeClass: async (req, res) => {
    try {
      const cls = req.body;
      if (!cls || typeof cls !== "object")
        return res
          .status(400)
          .json({ success: false, message: "Class JSON body required" });

      const text = buildClassText(cls);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(text);
    } catch (err) {
      console.error("serializeClass error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Serialize a single association JSON into .use association text
  serializeAssociation: async (req, res) => {
    try {
      const assoc = req.body;
      if (!assoc || typeof assoc !== "object") {
        return res
          .status(400)
          .json({ success: false, message: "Association JSON body required" });
      }

      const text = buildAssociationText(assoc);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(text);
    } catch (err) {
      console.error("serializeAssociation error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Serialize a single operation (optionally tied to a class) into .use text
  serializeOperation: async (req, res) => {
    try {
      const body = req.body || {};
      const className = body.class || null;
      const op = body.op;
      if (!op || typeof op !== "object") {
        return res
          .status(400)
          .json({ success: false, message: "Operation JSON required" });
      }

      // If a class name is provided, build a class block with only this operation
      if (className) {
        const cls = { name: className, operations: [op] };
        const text = buildClassText(cls);
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.send(text);
      }

      // Otherwise, serialize only the operation line
      const sig = op.signature !== undefined ? `(${op.signature})` : "()";
      const line = `${op.name || "op"}${sig}${op.returnType ? ` : ${op.returnType}` : ""}`;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(line);
    } catch (err) {
      console.error("serializeOperation error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Deserialize an operation: accept either a class block or a single operation line
  deserializeOperation: async (req, res) => {
    try {
      const text = (req.body && req.body.text) || "";
      const providedClass = (req.body && req.body.class) || null;
      if (!text || typeof text !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "Operation .use text required" });
      }

      // If the text contains a 'class' keyword, parse as class and extract operations
      if (/^\s*class\b/i.test(text) || /\bend\b/i.test(text)) {
        // Try to extract class block using existing parseClassText helper
        const parsedClass = parseClassText(text);
        if (!parsedClass)
          return res
            .status(400)
            .json({ success: false, message: "Invalid .use class text" });

        // return first operation if present, else empty
        const ops = Array.isArray(parsedClass.operations)
          ? parsedClass.operations
          : [];
        return res.json({
          success: true,
          class: parsedClass.name || null,
          ops,
        });
      }

      // Otherwise treat as a single operation line
      const op = parseOperationLine(text);
      if (!op)
        return res
          .status(400)
          .json({ success: false, message: "Invalid operation text" });

      // attach provided class if present
      const result = { op };
      if (providedClass) result.class = providedClass;
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error("deserializeOperation error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  save: async (req, res) => {
    // Save parsed model into DB tables
    try {
      let filePath = null;
      let originalInput = null; // keep the original input to build a public /uploads/ path
      if (req.file) {
        originalInput = req.file.path;
        filePath = path.resolve(req.file.path);
      } else if (req.files && req.files.length) {
        originalInput = req.files[0].path;
        filePath = path.resolve(req.files[0].path);
      } else if (req.body && req.body.path) {
        // Support public-style paths like '/uploads/filename.use' or 'uploads/filename.use'
        // Map them to the project's uploads directory rather than treating a leading
        // slash as an absolute filesystem root path.
        originalInput = req.body.path;
        const inputPath = String(req.body.path || "");
        const normalizedInput = inputPath.replace(/\\/g, "/");
        const uploadsMatch = normalizedInput.match(/^\/?uploads\/(.+)/i);
        if (uploadsMatch) {
          // resolve relative to project uploads folder
          filePath = path.resolve(__dirname, "..", "uploads", uploadsMatch[1]);
        } else if (path.isAbsolute(inputPath)) {
          filePath = path.normalize(inputPath);
        } else {
          filePath = path.resolve(inputPath);
        }
      } else {
        return res
          .status(400)
          .json({ success: false, message: "file upload or path required" });
      }

      if (!fs.existsSync(filePath))
        return res
          .status(404)
          .json({ success: false, message: "File not found" });

      // Normalize a public-facing path stored in DB. Prefer '/uploads/<filename>' when possible.
      const uploadsDir = path.resolve(__dirname, "..", "uploads");
      let publicPath = null;
      if (originalInput) {
        // normalize slashes for comparison
        const inp = originalInput.replace(/\\/g, "/");
        if (
          inp.startsWith("/uploads") ||
          inp.startsWith("uploads") ||
          inp.includes("/uploads/")
        ) {
          publicPath = inp.startsWith("/") ? inp : "/" + inp;
        }
      }
      if (!publicPath) {
        // if the resolved absolute path is inside uploads dir, use '/uploads/<basename>'
        const absUploads = uploadsDir.replace(/\\/g, "/");
        const absFile = filePath.replace(/\\/g, "/");
        if (absFile.startsWith(absUploads)) {
          publicPath = "/uploads/" + path.basename(filePath);
        } else {
          // fallback: store only the filename under /uploads to keep DB compact
          publicPath = "/uploads/" + path.basename(filePath);
        }
      }

      // run CLI
      let cliResult = null;
      try {
        cliResult = await runUseCli(filePath, 8000);
      } catch (e) {
        cliResult = { error: e.message };
      }

      const content = fs.readFileSync(filePath, "utf8");
      let parsed = null;
      if (cliResult && cliResult.stdout) {
        try {
          parsed = parseCliOutput(cliResult.stdout);
        } catch (e) {
          parsed = parseUseContentWithConditionals(content);
          console.error("Error parsing CLI output, fallback to file parse:", e);
        }
      } else parsed = parseUseContent(content);
      // ensure fallback case uses wrapper too
      if (!parsed || !parsed.model)
        parsed = parseUseContentWithConditionals(content);

      // Persist into DB
      const { sequelize } = require("../config/database");
      // ensure associations are wired
      require("../models/UseAssociations");
      const UseModel = require("../models/UseModel");
      const UseEnum = require("../models/UseEnum");
      const UseClass = require("../models/UseClass");
      const UseAttribute = require("../models/UseAttribute");
      const UseOperation = require("../models/UseOperation");
      const UseAssociation = require("../models/UseAssociation");
      const UseAssociationPart = require("../models/UseAssociationPart");
      const UseConstraint = require("../models/UseConstraint");
      const UseGeneralization = require("../models/UseGeneralization");

      const result = await sequelize.transaction(async (t) => {
        const ownerId = req.user && req.user.userId ? req.user.userId : null;
        const modelRow = await UseModel.create(
          {
            name: parsed.model || null,
            file_path: publicPath,
            owner_id: ownerId,
            raw_text:
              cliResult && cliResult.stdout ? cliResult.stdout : content,
          },
          { transaction: t }
        );

        // enums
        if (parsed.enums && parsed.enums.length) {
          for (const en of parsed.enums) {
            await UseEnum.create(
              {
                use_model_id: modelRow.id,
                name: en.name,
                values: (en.values || []).join(","),
              },
              { transaction: t }
            );
          }
        }

        // classes
        const classMap = {}; // name -> id
        if (parsed.classes && parsed.classes.length) {
          for (const cls of parsed.classes) {
            const c = await UseClass.create(
              { use_model_id: modelRow.id, name: cls.name },
              { transaction: t }
            );
            classMap[cls.name] = c.id;
            // attributes
            if (cls.attributes && cls.attributes.length) {
              for (const attr of cls.attributes) {
                await UseAttribute.create(
                  {
                    use_class_id: c.id,
                    name: attr.name,
                    type: attr.type || null,
                  },
                  { transaction: t }
                );
              }
            }
            // operations
            if (cls.operations && cls.operations.length) {
              for (const op of cls.operations) {
                await UseOperation.create(
                  {
                    use_class_id: c.id,
                    name: op.name,
                    signature: op.signature || null,
                  },
                  { transaction: t }
                );
              }
            }
          }
        }

        // associations
        if (parsed.associations && parsed.associations.length) {
          for (const assoc of parsed.associations) {
            const a = await UseAssociation.create(
              { use_model_id: modelRow.id, name: assoc.name },
              { transaction: t }
            );
            if (assoc.parts && assoc.parts.length) {
              for (const p of assoc.parts) {
                await UseAssociationPart.create(
                  {
                    use_association_id: a.id,
                    class_name: p.class,
                    multiplicity: p.multiplicity,
                    role: p.role,
                  },
                  { transaction: t }
                );
              }
            }

            // generalizations (superclasses) - persist as UseGeneralization rows
            if (parsed.classes && parsed.classes.length) {
              for (const cls of parsed.classes) {
                if (cls.superclasses && cls.superclasses.length) {
                  const childId = classMap[cls.name] || null;
                  for (const parentName of cls.superclasses) {
                    const parentId = classMap[parentName] || null;
                    await UseGeneralization.create(
                      {
                        use_model_id: modelRow.id,
                        specific_use_class_id: childId,
                        general_use_class_id: parentId,
                        specific_name: cls.name,
                        general_name: parentName,
                      },
                      { transaction: t }
                    );
                  }
                }
              }
            }
          }
        }

        // constraints: attempt to parse contexts from raw content (simple split)
        if (parsed && parsed.model) {
          // crude extraction: find 'constraints' section in CLI output or raw content
          const cliText =
            cliResult && cliResult.stdout ? cliResult.stdout : content;
          const consIdx = cliText.search(/\nconstraints\b/i);
          if (consIdx >= 0) {
            const consText = cliText.slice(consIdx);
            // split contexts by blank lines that start with 'context'
            const ctxRe = /context\s+([\s\S]*?)(?=\n\s*context\b|$)/gi;
            let cm;
            while ((cm = ctxRe.exec(consText)) !== null) {
              const block = cm[0].trim();
              const header = block.split("\n")[0];
              let contextName = null,
                kind = null,
                name = null,
                expr = block.split("\n").slice(1).join("\n").trim();
              const m1 = header.match(
                /^context\s+([^\s]+)\s*:\s*([A-Za-z0-9_]+)\s+inv\s+([^:]+):?/i
              );
              if (m1) {
                contextName = m1[2];
                kind = "invariant";
                name = m1[3] || null;
              } else {
                const m2 = header.match(
                  /^context\s+([A-Za-z0-9_:]+)\s*(?:\(|$)/i
                );
                if (m2) {
                  contextName = m2[1];
                  kind = "constraint";
                }
              }
              await UseConstraint.create(
                {
                  use_model_id: modelRow.id,
                  context: contextName,
                  kind,
                  name,
                  expression: expr,
                },
                { transaction: t }
              );
            }
          }
        }

        return modelRow;
      });

      return res.json({ success: true, model_id: result.id, cli: cliResult });
    } catch (error) {
      console.error("Save .use error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
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
  parseClassText(useText) {
    if (!useText || typeof useText !== "string") return null;

    const classRe =
      /^\s*(abstract\s+)?class\s+([A-Za-z0-9_]+)(?:\s+<\s+([^{\n]+))?/i;
    const attrRe = /^\s*([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_<>]+)\s*$/;

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
          // switch to operations and consume the remaining operation lines
          mode = "operations";
          // gather rest of the lines starting at next index
          // find current index in lines array (we're in a for..of, so rebuild index)
          const startIdx = lines.indexOf(line);
          const opsLines = lines.slice(startIdx + 1);
          const sigRe =
            /^\s*([A-Za-z0-9_:]+)\s*\(([^)]*)\)\s*(?::\s*([^=\n]+))?\s*(?:=\s*(.*))?$/;
          const opStartIdx = [];
          for (let j = 0; j < opsLines.length; j++) {
            if (!opsLines[j] || !opsLines[j].trim()) continue;
            if (sigRe.test(opsLines[j].trim())) opStartIdx.push(j);
          }
          if (!opStartIdx.length) {
            for (let j = 0; j < opsLines.length; j++) {
              if (opsLines[j] && opsLines[j].trim()) opStartIdx.push(j);
            }
          }
          for (let k = 0; k < opStartIdx.length; k++) {
            const s = opStartIdx[k];
            const e =
              k + 1 < opStartIdx.length ? opStartIdx[k + 1] : opsLines.length;
            const chunk = opsLines.slice(s, e);
            const header = (chunk[0] || "").trim();
            const rest = chunk.slice(1).join("\n").trim();
            const m = header.match(sigRe);
            if (!m) {
              cls.operations.push({ raw: chunk.join("\n").trim() });
              continue;
            }
            let fullName = m[1] || "";
            let classQualifier = null;
            let opName = fullName;
            if (fullName.includes("::")) {
              const partsQ = fullName.split("::");
              classQualifier = partsQ[0];
              opName = partsQ.slice(1).join("::");
            }
            const signature = (m[2] || "").trim();
            const returnType = m[3] ? m[3].trim() : null;
            const inlineBody = m[4] !== undefined ? String(m[4]).trim() : null;
            let bodyText = null;
            if (inlineBody && inlineBody.length)
              bodyText = inlineBody + (rest ? "\n" + rest : "");
            else if (rest) bodyText = rest;
            const opObj = {
              name: opName,
              fullName,
              class: classQualifier,
              signature,
              returnType,
            };
            if (bodyText) opObj.body = bodyText;
            cls.operations.push(opObj);
          }
          // we've consumed operations, break out of loop
          break;
        }
      }
    }

    return cls;
  },

  /**
   * Parse a `.use` association block into JSON.
   * Expected format:
   * association AssocName between
   *   Class1 [Multiplicity] role Role1
   *   Class2 [Multiplicity] role Role2
   * end
   */
  parseAssociationText(useText) {
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
  },

  // Deserialize a `.use` class block into JSON
  deserializeClass: async (req, res) => {
    try {
      const useText = req.body && req.body.text;
      if (!useText || typeof useText !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "Class .use text required" });
      }

      const json = parseClassText(useText);
      if (!json) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid .use class text" });
      }

      return res.json({ success: true, data: json });
    } catch (err) {
      console.error("deserializeClass error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Deserialize a `.use` association block into JSON
  deserializeAssociation: async (req, res) => {
    try {
      const useText = req.body && req.body.text;
      if (!useText || typeof useText !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "Association .use text required" });
      }

      const json = parseAssociationText(useText);
      if (!json) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid .use association text" });
      }

      return res.json({ success: true, data: json });
    } catch (err) {
      console.error("deserializeAssociation error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = UseController;
// Export helpful parser utility for tests and tooling (includes conditionals)
module.exports.parseUseContent = parseUseContentWithConditionals;
// Ensure `parseAssociationText` and `parseClassText` are properly defined and exported
module.exports.parseAssociationText = parseAssociationText;
module.exports.parseClassText = parseClassText;
