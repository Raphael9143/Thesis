const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const uploadDir = path.resolve(__dirname, "..", "uploads");
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const UseController = require("../controllers/UseController");

/**
 * @swagger
 * /api/use/parse:
 *   post:
 *     summary: Parse a .use model file and return JSON for frontend preview
 *     tags:
 *       - USE
 *     consumes:
 *       - multipart/form-data
 *       - application/json
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: The .use file to upload and parse. Use this OR the `path` body parameter.
 *       - in: body
 *         name: body
 *         required: false
 *         description: If no file is uploaded, provide a server-side path to an existing .use file.
 *         schema:
 *           type: object
 *           properties:
 *             path:
 *               type: string
 *               description: Relative or absolute path to a .use file on the server.
 *     responses:
 *       200:
 *         description: Parsed model and CLI output
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             cli:
 *               type: object
 *               description: Best-effort stdout/stderr from the USE CLI
 *             model:
 *               type: object
 *               description: Parsed JSON representation (model, enums, classes, associations)
 *       400:
 *         description: Missing file/path or invalid .use syntax/model
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error while parsing
 */
// POST /api/use/parse
// Accepts multipart file 'file' or JSON body { path: '/absolute/or/relative/path/file.use' }
// Use conditional middleware so JSON requests (body.path) won't trigger multer/busboy errors.
function conditionalUpload(req, res, next) {
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (ct.startsWith("multipart/form-data")) {
    // accept any file field name (more forgiving for clients); controller will pick first file
    return upload.any()(req, res, next);
  }
  return next();
}

router.post("/parse", conditionalUpload, UseController.parse);

// POST /api/use/save
// Saves parsed model into database tables. Accepts same inputs as /parse.
/**
 * @swagger
 * /api/use/save:
 *   post:
 *     summary: Parse a .use file and persist the model into database tables
 *     tags:
 *       - USE
 *     consumes:
 *       - multipart/form-data
 *       - application/json
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: The .use file to upload and save. Use this OR the `path` body parameter.
 *       - in: body
 *         name: body
 *         required: false
 *         description: If no file is uploaded, provide a server-side path to an existing .use file.
 *         schema:
 *           type: object
 *           properties:
 *             path:
 *               type: string
 *               description: Relative or absolute path to a .use file on the server
 *     responses:
 *       200:
 *         description: Model persisted successfully
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             model_id:
 *               type: integer
 *               description: ID of the saved UseModel row
 *             cli:
 *               type: object
 *               description: Best-effort stdout/stderr from the USE CLI
 *       400:
 *         description: Missing file or path
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error while saving
 */

router.post("/save", conditionalUpload, UseController.save);

module.exports = router;
