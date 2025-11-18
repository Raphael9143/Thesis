const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

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
          finalOut = lines.join('\r\n');
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
  const classBlockRe = /^class\s+([A-Za-z0-9_]+)[\s\S]*?^end\b/gim;
  let cb;
  while ((cb = classBlockRe.exec(content)) !== null) {
    const block = cb[0];
    const nameMatch = block.match(/^class\s+([A-Za-z0-9_]+)/im);
    const name = nameMatch ? nameMatch[1] : "Unknown";
    const cls = { name, attributes: [], operations: [] };

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

    // operations block within class
    const opMatch = block.match(/operations\s*([\s\S]*?)(?=\n\s*end\b)/im);
    if (opMatch) {
      const opBody = opMatch[1];
      const opLines = opBody
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (const line of opLines) {
        const m = line.match(/^([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
        if (m) cls.operations.push({ name: m[1], signature: m[2].trim() });
      }
    }

    res.classes.push(cls);
  }

  // Associations
  const assocRe = /association\s+(\w+)\s+between([\s\S]*?)end/gi;
  let am;
  while ((am = assocRe.exec(content)) !== null) {
    const name = am[1];
    const body = am[2];
    const lines = body
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const parts = [];
    for (const line of lines) {
      // e.g. Customer [1] role owner OR Customer [1]
      const m = line.match(
        /([A-Za-z0-9_]+)\s*\[([^\]]+)\](?:\s+role\s+([A-Za-z0-9_]+))?/i
      );
      if (m)
        parts.push({
          class: m[1],
          multiplicity: m[2].trim(),
          role: m[3] || m[1].toLowerCase(),
        });
    }
    res.associations.push({ name, parts });
  }

  return res;
}

function parseCliOutput(cliOut) {
  const idx = cliOut.search(/\n?model\s+/i);
  const payload = idx >= 0 ? cliOut.slice(idx) : cliOut;
  // Reuse parseUseContent on the cleaned payload
  return parseUseContent(payload);
}

const UseController = {
  // Get a stored USE model by id with related entities
  getById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid id" });
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
      const errorPattern =
        /error|syntax\s+error|could\s+not\s+open|failed|no viable alternative/i;
      const hasCliError = errorPattern.test(stderrText + "\n" + stdoutText);
      const hasModelLine = /(^|\n)\s*model\s+[A-Za-z0-9_]+/i.test(stdoutText);

      if (!hasCliError && hasModelLine && cliResult && cliResult.stdout) {
        try {
          parsed = parseCliOutput(cliResult.stdout);
        } catch {
          parsed = null;
        }
      }

      // Fallback to parsing raw file content if CLI isn't available or failed
      if (!parsed || !parsed.model) {
        parsed = parseUseContent(content);
      }

      // If still no model parsed, return a helpful error using CLI message if present
      if (!parsed || !parsed.model) {
        const errorMatch = (stderrText + "\n" + stdoutText).match(
          /line\s+\d+:\d+\s+.+/i
        );
        const errorMessage = errorMatch
          ? errorMatch[0]
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
          parsed = parseUseContent(content);
          console.error("Error parsing CLI output, fallback to file parse:", e);
        }
      } else parsed = parseUseContent(content);

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

      const result = await sequelize.transaction(async (t) => {
        const ownerId = req.user && req.user.userId ? req.user.userId : null;
        const modelRow = await UseModel.create(
          {
            name: parsed.model || null,
            file_path: publicPath,
            owner_id: ownerId,
            raw_text: cliResult && cliResult.stdout ? cliResult.stdout : content,
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
};

module.exports = UseController;
