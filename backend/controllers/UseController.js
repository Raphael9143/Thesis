const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Path to the bundled USE CLI batch
const USE_BIN = path.resolve(__dirname, '..', 'use-7.5.0', 'bin');
const USE_BATCH = path.join(USE_BIN, 'use.bat');

function runUseCli(filePath, timeout = 5000) {
  return new Promise((resolve, reject) => {
    let proc = null;
    const spawnUse = () => {
      try {
        // Use shell to allow PATH lookup for `use` command
        return spawn('use', [], { shell: true });
      } catch (e) {
        return null;
      }
    };
    const spawnBatch = () => {
      if (!fs.existsSync(USE_BATCH)) return null;
      try {
        return spawn(USE_BATCH, [], { cwd: USE_BIN, shell: true });
      } catch (e) {
        return null;
      }
    };

    proc = spawnUse() || spawnBatch();
    if (!proc) return reject(new Error('USE CLI not found'));

    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      try { proc.kill(); } catch (e) {}
      reject(new Error('USE CLI timed out'));
    }, timeout);

    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });

    proc.on('close', code => {
      clearTimeout(timer);
      return resolve({ code, stdout: out, stderr: err });
    });

    // Send commands to the USE process: open <file>, then info model, then quit
    // Ensure file path quoting works across shells
    const openCmd = `open "${filePath.replace(/"/g, '\\"')}"\n`;
    proc.stdin.write(openCmd);
    proc.stdin.write('info model\n');
    proc.stdin.write('quit\n');
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
    const values = body.split(',').map(v => v.trim()).filter(Boolean);
    res.enums.push({ name, values });
  }

  // Classes (robust, multiline-aware)
  const classBlockRe = /^class\s+([A-Za-z0-9_]+)[\s\S]*?^end\b/gim;
  let cb;
  while ((cb = classBlockRe.exec(content)) !== null) {
    const block = cb[0];
    const nameMatch = block.match(/^class\s+([A-Za-z0-9_]+)/im);
    const name = nameMatch ? nameMatch[1] : 'Unknown';
    const cls = { name, attributes: [], operations: [] };

    // attributes block within class
    const attrMatch = block.match(/attributes\s*([\s\S]*?)(?:operations\b|\n\s*end\b)/im);
    if (attrMatch) {
      const attrBody = attrMatch[1];
      const lines = attrBody.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        // match 'name : Type' allowing namespace in type
        const m = line.match(/^([a-zA-Z0-9_]+)\s*:\s*([A-Za-z0-9_:<>]+)\s*$/);
        if (m) cls.attributes.push({ name: m[1], type: m[2] });
      }
    }

    // operations block within class
  const opMatch = block.match(/operations\s*([\s\S]*?)(?=\n\s*end\b)/im);
    if (opMatch) {
      const opBody = opMatch[1];
      const opLines = opBody.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
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
    const lines = body.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parts = [];
    for (const line of lines) {
      // e.g. Customer [1] role owner
      const m = line.match(/([A-Za-z0-9_]+)\s*\[([^\]]+)\]\s*role\s*([A-Za-z0-9_]+)/i);
      if (m) parts.push({ class: m[1], multiplicity: m[2].trim(), role: m[3] });
    }
    res.associations.push({ name, parts });
  }

  return res;
}

function parseCliOutput(cliOut) {
  // The CLI prints some header lines before the normalized model (e.g., "Model BankingSystem ..." and prompts)
  // Extract the portion starting at the first line that begins with 'model ' (case-insensitive)
  const idx = cliOut.search(/\n?model\s+/i);
  const payload = idx >= 0 ? cliOut.slice(idx) : cliOut;
  // Reuse parseUseContent on the cleaned payload
  return parseUseContent(payload);
}

const UseController = {
  parse: async (req, res) => {
    try {
      let filePath = null;
      if (req.file) {
        filePath = path.resolve(req.file.path);
      } else if (req.files && req.files.length) {
        // multer.any() puts files in req.files
        filePath = path.resolve(req.files[0].path);
      } else if (req.body && req.body.path) {
        filePath = path.resolve(req.body.path);
      } else {
        return res.status(400).json({ success: false, message: 'file upload or path required' });
      }

      if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found' });

      // Run USE CLI (best-effort) and also parse file locally
      let cliResult = null;
      try {
        cliResult = await runUseCli(filePath, 8000);
      } catch (err) {
        cliResult = { error: err.message };
      }

      const content = fs.readFileSync(filePath, 'utf8');
      // Prefer parsing CLI output if available (it's the normalized model), otherwise parse the file content
      let parsed = null;
      if (cliResult && cliResult.stdout) {
        try {
          parsed = parseCliOutput(cliResult.stdout);
        } catch (e) {
          // fallback to parsing raw file
          parsed = parseUseContent(content);
        }
      } else {
        parsed = parseUseContent(content);
      }

      return res.json({ success: true, cli: cliResult, model: parsed });
    } catch (error) {
      console.error('Parse .use error:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
};

module.exports = UseController;
