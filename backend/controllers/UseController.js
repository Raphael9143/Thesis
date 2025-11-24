const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Import the parseAssociationText and parseClassText utility functions
const parseAssociationText = require("../utils/parseAssociationText");
const parseClassText = require("../utils/parseClassText");
// central parse helpers
const {
  parseUseContent,
  parseUseContentWithConditionals,
  extractConditionals,
  parseCliOutput,
  extractFirstCliError,
} = require("../utils/parseUse");

// Path to the bundled USE CLI batch
const USE_BIN = path.resolve(__dirname, "..", "use-7.5.0", "bin");
const USE_BATCH = path.join(USE_BIN, "use.bat");

function runUseCli(filePath, timeout = 20000) {
  // Attempt to run the USE CLI and request 'info model' for the loaded file.
  // Returns a promise resolving to { stdout, stderr, code } or rejects on fatal error.
  return new Promise((resolve, reject) => {
    if (!filePath || typeof filePath !== "string")
      return reject(new Error("filePath required"));

    const trySpawn = (cmdStr, opts) => {
      try {
        return spawn(cmdStr, { shell: true, ...opts });
      } catch {
        return null;
      }
    };

    // Build candidate commands. Prefer bundled batch if present (may accept file arg),
    // otherwise spawn 'use' and pipe commands to its stdin.
    const candidates = [];
    if (fs.existsSync(USE_BATCH)) {
      // call batch with the file as argument; some USE wrappers accept filename
      candidates.push(`"${USE_BATCH}" "${filePath}"`);
    }
    // generic 'use' invocation (we will write commands to stdin)
    candidates.push("use");

    let proc = null;
    for (const c of candidates) {
      proc = trySpawn(c, { cwd: USE_BIN });
      if (proc) break;
    }

    if (!proc) return reject(new Error("USE CLI not found"));

    let out = "";
    let err = "";
    let resolved = false;

    const timer = setTimeout(() => {
      try {
        if (proc && proc.kill) proc.kill();
      } catch (e) {
        console.error("Error killing USE CLI process:", e);
      }
      if (!resolved) {
        resolved = true;
        reject(new Error("USE CLI timed out"));
      }
    }, timeout);

    proc.stdout.on("data", (d) => {
      try {
        out += String(d || "");
        // If we detect the model header in output, resolve early with collected output
        if (!resolved && /(^|\n)\s*model\s+[A-Za-z0-9_]+/i.test(out)) {
          resolved = true;
          clearTimeout(timer);
          // attempt to close process gracefully
          try {
            if (proc.stdin && !proc.stdin.destroyed) proc.stdin.end();
          } catch (e) {
            console.error("Error ending USE CLI stdin:", e);
          }
          resolve({ stdout: out, stderr: err, code: 0 });
        }
      } catch (e) {
        console.error("Error processing USE CLI stdout:", e);
      }
    });
    proc.stderr.on("data", (d) => {
      err += String(d || "");
    });

    proc.on("close", (code) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve({ stdout: out, stderr: err, code });
    });
    proc.on("error", (e) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      reject(e);
    });

    // Provide commands via stdin when possible to instruct USE to load the file and print info
    try {
      if (proc.stdin && !proc.stdin.destroyed) {
        // send info model and quit; some USE builds accept the filename as arg and will print model
        const cmds = [];
        cmds.push("info model\n");
        cmds.push("quit\n");
        proc.stdin.write(cmds.join(""));
        proc.stdin.end();
      }
    } catch (e) {
      console.error("Error writing to USE CLI stdin:", e);
    }
  });
}

// parseUseContentWithConditionals, extractFirstCliError, extractConditionals,
// and parseCliOutput are provided by ../utils/parseUse.js and are imported above.

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

  // Associations
  // NOTE: associations will be appended after classes to keep classes grouped first

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
          if (typeof a === "string") {
            lines.push("    " + a);
          } else if (a && typeof a === "object") {
            const t = a.type ? ` : ${a.type}` : "";
            lines.push(`    ${a.name || "unnamed"}${t}`);
          }
        }
      }

      // combine plain operations and query_operations, but preserve body information
      const allOps = [];
      if (Array.isArray(cls.operations)) allOps.push(...cls.operations);
      if (Array.isArray(cls.query_operations)) allOps.push(...cls.query_operations);
      if (allOps.length) {
        lines.push("  operations");
        for (const op of allOps) {
          if (typeof op === "string") {
            lines.push("    " + op);
            continue;
          }
          if (!op || typeof op !== "object") continue;

          const sig = op.signature !== undefined ? `(${op.signature})` : "()";
          const ret = op.returnType ? ` : ${op.returnType}` : "";
          const name = op.name || op.fullName || "op";

          if (op.body && String(op.body).trim()) {
            const b = String(op.body);
            const trimmed = b.trim();
            const isBlock = /\n/.test(b) || /^begin\b/i.test(trimmed);
            if (isBlock) {
              // multi-line block: write signature line then indent body lines
              lines.push(`    ${name}${sig}${ret}`);
              const bodyLines = b.split(/\r?\n/);
              for (const l of bodyLines) {
                lines.push("      " + l);
              }
            } else {
              // single-line expression: use inline '='
              lines.push(`    ${name}${sig}${ret} = ${trimmed}`);
            }
          } else {
            // no body
            lines.push(`    ${name}${sig}${ret}`);
          }
        }
      }

      lines.push("end");
      lines.push("");
    }
  }

  // Associations: append after classes to keep class blocks grouped together
  if (Array.isArray(modelJson.associations)) {
    for (const assoc of modelJson.associations) {
      try {
        const txt = buildAssociationText(assoc);
        if (txt && txt.length) {
          lines.push(txt);
          lines.push("");
        }
      } catch {
        // skip bad associations
      }
    }
  }

  // Constraints: render as a top-level 'constraints' block with indented bodies
  // If no structured constraints are provided, try to extract 'context' blocks from raw_text
  let constraints = Array.isArray(modelJson.constraints)
    ? modelJson.constraints.slice()
    : [];
  if ((!constraints || !constraints.length) && modelJson.raw_text &&
    typeof modelJson.raw_text === "string") {
    try {
      const raw = String(modelJson.raw_text || "");
      // If the raw text contains a 'constraints' section, capture each top-level
      // constraint (separated by blank lines) and preserve them as raw strings
      // so the exporter can re-emit them verbatim.
      const consMatch = raw.match(/(?:\r?\n|^)\s*constraints\s*([\s\S]*?)$/i);
      if (consMatch && consMatch[1]) {
        const block = String(consMatch[1] || "").trim();
        const parts = block
          .split(/\r?\n\s*\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        for (const p of parts) constraints.push(p);
      }

      // Also attempt to extract 'context' blocks (for structured invariants)
      const ctxRe = /context\s+([^\r\n]+)([\s\S]*?)(?=(?:\r?\n)\s*context\b|\r?\n\s*\r?\n|$)/gim;
      let m;
      while ((m = ctxRe.exec(raw)) !== null) {
        const header = (m[1] || "").trim();
        const body = (m[2] || "").trim();
        // header may be 'Class inv name' or an operation signature
        const invMatch = header.match(/^([A-Za-z0-9_:<>]+)\s+inv\s+([A-Za-z0-9_]+)$/i);
        if (invMatch) {
          constraints.push({
            context: invMatch[1],
            kind: "invariant",
            name: invMatch[2],
            expression: body,
          });
        } else {
          // fallback: store header and body
          constraints.push({ context: header, kind: "constraint", expression: body });
        }
      }
    } catch {
      // ignore extraction errors
    }
  }

  if (Array.isArray(constraints) && constraints.length) {
    lines.push("constraints");
    lines.push("");
    for (const c of constraints) {
      try {
        if (!c) continue;
        if (typeof c === "string") {
          // raw constraint text (assume already formatted)
          lines.push(c.trim());
          lines.push("");
          continue;
        }

        const ctx = c.context || c.contextName || c.context_name || c.header || "";
        const kind = (c.kind || "").toLowerCase();
        const name = c.name || c.label || "";
        const expr = (c.expression || c.expr || c.body || c.raw || "").toString().trim();

        // If ctx is an operation signature (contains '::'), render header and pre/post
        if (ctx && /::/.test(ctx)) {
          lines.push(`context ${ctx}`);
          if ((kind === "pre" || kind === "post") && expr) {
            if (name) lines.push(`  ${kind} ${name}: ${expr}`);
            else lines.push(`  ${kind}: ${expr}`);
          } else if ((kind === "invariant" || kind === "inv") && expr) {
            // operation-level invariant: print as inv name then body
            const nm = name ? ` ${name}` : "";
            lines.push(`  inv${nm}: ${expr}`);
          } else if (expr) {
            lines.push(`  ${expr}`);
          }
          lines.push("");
          continue;
        }

        // Class-level constraints: usually invariants named via 'inv'
        if (ctx && (kind === "invariant" || kind === "inv")) {
          const nm = name ? ` ${name}` : "";
          lines.push(`context ${ctx} inv${nm}:`);
          if (expr) {
            const bodyLines = expr.split(/\r?\n/);
            for (const bl of bodyLines) lines.push(`  ${bl}`);
          }
          lines.push("");
          continue;
        }

        // pre/post attached to a named context (non-operation)
        if (ctx && (kind === "pre" || kind === "post")) {
          const nm = name ? ` ${name}` : "";
          lines.push(`context ${ctx} ${kind}${nm}:`);
          if (expr) {
            const bodyLines = expr.split(/\r?\n/);
            for (const bl of bodyLines) lines.push(`  ${bl}`);
          }
          lines.push("");
          continue;
        }

        // Generic fallback: print header if we have context, else dump expression
        if (ctx) {
          lines.push(`context ${ctx}`);
          if (expr) {
            const bodyLines = expr.split(/\r?\n/);
            for (const bl of bodyLines) lines.push(`  ${bl}`);
          }
          lines.push("");
          continue;
        }

        if (expr) {
          lines.push(expr);
          lines.push("");
        }
      } catch {
        // ignore formatting errors for individual constraints
      }
    }
  }

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
      if (typeof a === "string") {
        lines.push("    " + a);
      } else if (a && typeof a === "object") {
        const t = a.type ? ` : ${a.type}` : "";
        lines.push(`    ${a.name || "unnamed"}${t}`);
      }
    }
  }

  // Render imperative operations first (operations[]), then query operations
  const hasOps = (Array.isArray(cls.operations) && cls.operations.length) ||
    (Array.isArray(cls.query_operations) && cls.query_operations.length);
  if (hasOps) {
    lines.push("  operations");

    // plain operations: render bodies inline/block as appropriate
    if (Array.isArray(cls.operations)) {
      for (const op of cls.operations) {
        if (typeof op === "string") {
          lines.push("    " + op);
          continue;
        }
        if (!op || typeof op !== "object") continue;
        const sig = op.signature !== undefined ? `(${op.signature})` : "()";
        const ret = op.returnType ? ` : ${op.returnType}` : "";
        const name = op.name || op.fullName || "op";
        if (op.body && String(op.body).trim()) {
          const b = String(op.body);
          const trimmed = b.trim();
          const isBlock = /\n/.test(b) || /^begin\b/i.test(trimmed);
          if (isBlock) {
            lines.push(`    ${name}${sig}${ret}`);
            const bodyLines = b.split(/\r?\n/);
            for (const l of bodyLines) lines.push("      " + l);
          } else {
            lines.push(`    ${name}${sig}${ret} = ${trimmed}`);
          }
        } else {
          lines.push(`    ${name}${sig}${ret}`);
        }
      }
    }

    // query operations: render signature then '=' on same line and body indented on following lines
    if (Array.isArray(cls.query_operations)) {
      for (const op of cls.query_operations) {
        if (typeof op === "string") {
          lines.push("    " + op);
          continue;
        }
        if (!op || typeof op !== "object") continue;
        const sig = op.signature !== undefined ? `(${op.signature})` : "()";
        const ret = op.returnType ? ` : ${op.returnType}` : "";
        const name = op.name || op.fullName || "op";
        if (op.body && String(op.body).trim()) {
          const b = String(op.body);
          const bodyLines = b.split(/\r?\n/);
          // write signature with '=' then newline and indented body
          lines.push(`    ${name}${sig}${ret} = `);
          for (const l of bodyLines) lines.push("      " + l);
        } else {
          lines.push(`    ${name}${sig}${ret}`);
        }
      }
    }
  }

  lines.push("end");
  return lines.join("\n");
}

// Build constraints block text from an array of constraint entries or raw_text
function buildConstraintsText(constraints, rawText, includeHeader = true) {
  const lines = [];
  const cons = Array.isArray(constraints) ? constraints.slice() : [];
  // If no structured constraints, try extracting from rawText
  if ((!cons || !cons.length) && rawText && typeof rawText === "string") {
    try {
      const raw = String(rawText || "");
      const consMatch = raw.match(/(?:\r?\n|^)\s*constraints\s*([\s\S]*?)$/i);
      if (consMatch && consMatch[1]) {
        const block = String(consMatch[1] || "").trim();
        const parts = block
          .split(/\r?\n\s*\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        for (const p of parts) cons.push(p);
      }
    } catch {
      // ignore
    }
  }

  if (!cons || !cons.length) return "";
  if (includeHeader) {
    lines.push("constraints");
    lines.push("");
  }
  for (const c of cons) {
    try {
      if (!c) continue;
      if (typeof c === "string") {
        lines.push(c.trim());
        lines.push("");
        continue;
      }
      const ctx = c.context || c.contextName || c.context_name || c.header || "";
      const kind = (c.kind || "").toLowerCase();
      const name = c.name || c.label || "";
      const expr = (c.expression || c.expr || c.body || c.raw || "").toString().trim();

      if (ctx && /::/.test(ctx)) {
        lines.push(`context ${ctx}`);
        if ((kind === "pre" || kind === "post") && expr) {
          if (name) lines.push(`  ${kind} ${name}: ${expr}`);
          else lines.push(`  ${kind}: ${expr}`);
        } else if ((kind === "invariant" || kind === "inv") && expr) {
          const nm = name ? ` ${name}` : "";
          lines.push(`  inv${nm}: ${expr}`);
        } else if (expr) {
          lines.push(`  ${expr}`);
        }
        lines.push("");
        continue;
      }

      if (ctx && (kind === "invariant" || kind === "inv")) {
        const nm = name ? ` ${name}` : "";
        lines.push(`context ${ctx} inv${nm}:`);
        if (expr) {
          const bodyLines = expr.split(/\r?\n/);
          for (const bl of bodyLines) lines.push(`  ${bl}`);
        }
        lines.push("");
        continue;
      }

      if (ctx && (kind === "pre" || kind === "post")) {
        const nm = name ? ` ${name}` : "";
        lines.push(`context ${ctx} ${kind}${nm}:`);
        if (expr) {
          const bodyLines = expr.split(/\r?\n/);
          for (const bl of bodyLines) lines.push(`  ${bl}`);
        }
        lines.push("");
        continue;
      }

      if (ctx) {
        lines.push(`context ${ctx}`);
        if (expr) {
          const bodyLines = expr.split(/\r?\n/);
          for (const bl of bodyLines) lines.push(`  ${bl}`);
        }
        lines.push("");
        continue;
      }

      if (expr) {
        lines.push(expr);
        lines.push("");
      }
    } catch {
      // ignore
    }
  }
  return lines.join("\n");
}

// Parse constraints text into structured array using existing parser helper
function parseConstraintsText(text) {
  if (!text || typeof text !== "string") return [];
  try {
    // reuse parseUseContent which extracts 'context' blocks and pre/post/inv
    const parsed = parseUseContent(text);
    // If parsed.constraints found, return them; else return split raw constraints
    if (Array.isArray(parsed.constraints) && parsed.constraints.length) return parsed.constraints;
    // fallback: split by blank lines in the constraints section
    const consMatch = text.match(/(?:\r?\n|^)\s*constraints\s*([\s\S]*?)$/i);
    const out = [];
    if (consMatch && consMatch[1]) {
      const block = String(consMatch[1] || "").trim();
      const parts = block.split(/\r?\n\s*\r?\n/).map((s) => s.trim()).filter(Boolean);
      for (const p of parts) out.push({ raw: p, expression: p });
    } else {
      // no explicit constraints header: split whole text
      const parts = text.split(/\r?\n\s*\r?\n/).map((s) => s.trim()).filter(Boolean);
      for (const p of parts) out.push({ raw: p, expression: p });
    }
    return out;
  } catch {
    return [{ raw: text, expression: text }];
  }
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
        cliResult = await runUseCli(filePath, 20000);
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
        // keep original file text so downstream exporters can extract constraints
        try {
          parsed.raw_text = content;
        } catch {
          /* ignore */
        }
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
      const embedParse =
        (req.query && String(req.query.embedParse).toLowerCase() === "true") ||
        (req.body && req.body.embedParse === true);

      if (embedParse) {
        // Attempt to validate/parse the exported text using the USE CLI first,
        // falling back to the local JS parser in utils/parseUse.js.
        const uploadsDir = path.resolve(__dirname, "..", "uploads");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const tmpName = `uml_export_parse_${Date.now()}.use`;
        const tmpPath = path.join(uploadsDir, tmpName);
        fs.writeFileSync(tmpPath, useText, "utf8");

        let parsed = null;
        let cliRes = null;
        try {
          try {
            cliRes = await runUseCli(tmpPath, 20000);
          } catch (e) {
            cliRes = { error: e.message };
          }

          const stderrText = (cliRes && cliRes.stderr) || "";
          const stdoutText = (cliRes && cliRes.stdout) || "";
          const cliHasStdErr = stderrText && String(stderrText).trim().length > 0;

          // If CLI produced a valid model line and no stderr, prefer parsing CLI output
          const hasModelLine = /(^|\n)\s*model\s+[A-Za-z0-9_]+/i.test(stdoutText);
          if (!cliHasStdErr && hasModelLine && cliRes && cliRes.stdout) {
            try {
              parsed = parseCliOutput(cliRes.stdout);
              parsed._parseSource = "cli";
            } catch {
              parsed = null;
            }
          }

          // fallback to JS parser on the generated text
          if (!parsed || !parsed.model) {
            try {
              parsed = parseUseContentWithConditionals(useText);
              parsed._parseSource = "text";
              // attach the generated USE text so buildUseText can extract constraints
              parsed.raw_text = useText;
            } catch (e) {
              parsed = { error: String(e && e.message ? e.message : e) };
            }
          }
        } finally {
          try {
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
          } catch (e) {
            console.error("Error deleting temp USE file:", e);
          }
        }

        // Ensure common fields exist for clients: query_operations on classes and associations,
        // and constraints array (may be populated by CLI parse or local parser).
        try {
          if (!parsed) parsed = { error: "no parse result" };
          if (!Array.isArray(parsed.constraints)) parsed.constraints = [];
          if (Array.isArray(parsed.classes)) {
            for (const c of parsed.classes) {
              if (!Array.isArray(c.query_operations)) c.query_operations = [];
              if (!Array.isArray(c.operations)) c.operations = c.operations || [];
            }
          }
          if (Array.isArray(parsed.associations)) {
            for (const a of parsed.associations) {
              if (!Array.isArray(a.query_operations)) a.query_operations = a.query_operations || [];
            }
          }
        } catch (e) {
          console.error("Error normalizing parsed structure:", e);
        }

        return res.json({ success: true, useText, parsed, cli: cliRes });
      }
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
          cliRes = await runUseCli(tmpPath, 20000);
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
  // Serialize constraints: accept { constraints: [...], raw_text? }
  serializeConstraints: async (req, res) => {
    try {
      const body = req.body || {};
      let constraints = [];
      let rawText = body.raw_text || body.rawText || null;

      // Accept either:
      // - { constraints: [ ... ] }
      // - { constraint: { ... } } (single constraint)
      // - a single constraint object as the request body (has context/kind/expression)
      if (Array.isArray(body.constraints)) {
        constraints = body.constraints.slice();
      } else if (Array.isArray(body.constraint)) {
        constraints = body.constraint.slice();
      } else if (body && typeof body === "object") {
        // body itself may be a single constraint object
        const maybe = body;
        const hasConstraintFields =
          Object.prototype.hasOwnProperty.call(maybe, "context") ||
          Object.prototype.hasOwnProperty.call(maybe, "kind") ||
          Object.prototype.hasOwnProperty.call(maybe, "expression") ||
          Object.prototype.hasOwnProperty.call(maybe, "raw");
        if (hasConstraintFields && !body.constraints) {
          constraints = [maybe];
        }
      }

      // Create a normalized copy of constraints to avoid mutating caller objects.
      let normalizedConstraints = [];
      if (Array.isArray(constraints)) {
        normalizedConstraints = constraints.map((orig) => {
          const c = Object.assign({}, orig || {});
          if (!c.kind && c.type) c.kind = String(c.type).toLowerCase();
          // normalize common variants: 'precondition' -> 'pre', 'postcondition' -> 'post',
          // 'invariant'/'inv' -> 'invariant'
          if (c.kind && typeof c.kind === "string") {
            const kk = c.kind.toLowerCase();
            if (kk.indexOf("pre") !== -1) c.kind = "pre";
            else if (kk.indexOf("post") !== -1) c.kind = "post";
            else if (kk.indexOf("inv") !== -1) c.kind = "invariant";
            else c.kind = kk;
          }
          if (!c.expression && (c.raw || c.expr)) {
            c.expression = c.raw || c.expr;
          }
          if (c.expression && !c.raw) c.raw = c.expression;
          return c;
        });
      }

      // If caller requested no_header or we're serializing a single constraint,
      // omit the top-level `constraints` header to return just the context/body.
      const noHeaderFlag = body.no_header === true;
      const hasSingle = Array.isArray(constraints) && constraints.length === 1;
      const includeHeader = !(noHeaderFlag || hasSingle);
      const toSend = normalizedConstraints.length ? normalizedConstraints : constraints;
      const txt = buildConstraintsText(toSend, rawText, includeHeader);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(txt);
    } catch (err) {
      console.error("serializeConstraints error:", err);
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
        cliResult = await runUseCli(filePath, 20000);
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
          const sr = /^\s*([A-Za-z0-9_:]+)\s*\(([^)]*)\)\s*(?::\s*([^=\n]+))?\s*(?:=\s*(.*))?$/;
          const opStartIdx = [];
          for (let j = 0; j < opsLines.length; j++) {
            if (!opsLines[j] || !opsLines[j].trim()) continue;
            if (sr.test(opsLines[j].trim())) opStartIdx.push(j);
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
            const m = header.match(sr);
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
            if (inlineBody && inlineBody.length) {
              bodyText = inlineBody;
              if (rest) bodyText += "\n" + rest;
            } else if (rest) {
              bodyText = rest;
            }
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
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
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
        } else if (/^attributes$/i.test(line)) {
          mode = "attributes";
        } else if (/^operations$/i.test(line)) {
          mode = "operations";
          // gather operations block from remaining lines
          const opsLines = lines.slice(i + 1);
          const sr = /^\s*([A-Za-z0-9_:]+)\s*\(([^)]*)\)\s*(?::\s*([^=\n]+))?\s*(?:=\s*(.*))?$/;
          const opStartIdx = [];
          for (let j = 0; j < opsLines.length; j++) {
            if (!opsLines[j] || !opsLines[j].trim()) continue;
            if (sr.test(opsLines[j].trim())) opStartIdx.push(j);
          }
          if (!opStartIdx.length) {
            for (let j = 0; j < opsLines.length; j++) {
              if (opsLines[j] && opsLines[j].trim()) opStartIdx.push(j);
            }
          }
          for (let k = 0; k < opStartIdx.length; k++) {
            const s = opStartIdx[k];
            const e = k + 1 < opStartIdx.length ? opStartIdx[k + 1] : opsLines.length;
            const chunk = opsLines.slice(s, e);
            const header = (chunk[0] || "").trim();
            const rest = chunk.slice(1).join("\n").trim();
            const m = header.match(sr);
            if (!m) {
              assoc.operations = assoc.operations || [];
              assoc.operations.push({ raw: chunk.join("\n").trim() });
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
            if (inlineBody && inlineBody.length) {
              bodyText = inlineBody;
              if (rest) bodyText += "\n" + rest;
            } else if (rest) {
              bodyText = rest;
            }
            assoc.operations = assoc.operations || [];
            const opObj = {
              name: opName,
              fullName,
              class: classQualifier,
              signature,
              returnType,
            };
            if (bodyText) opObj.body = bodyText;
            assoc.operations.push(opObj);
          }
          break;
        }
      } else if (mode === "attributes") {
        const amatch = line.match(/^([a-zA-Z0-9_]+)\s*:\s*(.+)$/);
        if (amatch) {
          assoc.attributes = assoc.attributes || [];
          assoc.attributes.push({ name: amatch[1], type: amatch[2].trim() });
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
  // Deserialize constraints block into structured JSON
  deserializeConstraints: async (req, res) => {
    try {
      const text = (req.body && req.body.text) || "";
      if (!text || typeof text !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "Constraints text required" });
      }

      const parsed = parseConstraintsText(text);
      return res.json({ success: true, data: parsed });
    } catch (err) {
      console.error("deserializeConstraints error:", err);
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
module.exports.buildUseText = buildUseText;
module.exports.buildClassText = buildClassText;
module.exports.buildConstraintsText = buildConstraintsText;
module.exports.parseConstraintsText = parseConstraintsText;
