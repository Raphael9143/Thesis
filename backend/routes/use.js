const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const uploadDir = path.resolve(__dirname, '..', 'uploads');
const storage = multer.diskStorage({ destination: uploadDir, filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname) });
const upload = multer({ storage });

const UseController = require('../controllers/UseController');

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
 *         description: When no file is uploaded, provide a server-side path to an existing .use file.
 *         schema:
 *           type: object
 *           properties:
 *             path:
 *               type: string
 *               description: Relative or absolute path to a .use file on the server (e.g., uploads/banking.use)
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
 *               description: Best-effort stdout/stderr from the USE CLI (may contain errors if CLI could not run)
 *             model:
 *               type: object
 *               description: Parsed JSON representation (model, enums, classes, associations)
 *       400:
 *         description: Missing file or path
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error while parsing
 */
// POST /api/use/parse
// Accepts multipart file 'file' or JSON body { path: '/absolute/or/relative/path/file.use' }
// Use conditional middleware so JSON requests (body.path) won't trigger multer/busboy errors.
function conditionalUpload(req, res, next) {
	const ct = (req.headers['content-type'] || '').toLowerCase();
	if (ct.startsWith('multipart/form-data')) {
		// accept any file field name (more forgiving for clients); controller will pick first file
		return upload.any()(req, res, next);
	}
	return next();
}

router.post('/parse', conditionalUpload, UseController.parse);

module.exports = router;
