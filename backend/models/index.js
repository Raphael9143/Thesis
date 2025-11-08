const fs = require("fs");
const path = require("path");

// Auto-require all model files in this directory.
// Load model definitions first, then load associations wiring last (if present).
const basename = path.basename(__filename);
const files = fs
  .readdirSync(__dirname)
  .filter((f) => f !== basename && f.endsWith(".js"));

// Prefer to require everything except UseAssociations first
const assocFile = "UseAssociations.js";
const modelFiles = files.filter((f) => f !== assocFile).sort();

for (const file of modelFiles) {
  try {
    require(path.join(__dirname, file));
  } catch (err) {
    // don't crash on a single model load error; log and continue
    console.error(
      `[models] failed to load ${file}:`,
      err && err.message ? err.message : err
    );
  }
}

// load associations (if present) after models
if (files.includes(assocFile)) {
  try {
    require(path.join(__dirname, assocFile));
  } catch (err) {
    console.error(
      "[models] failed to load associations:",
      err && err.message ? err.message : err
    );
  }
}

module.exports = {};
