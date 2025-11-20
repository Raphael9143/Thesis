const express = require("express");
const router = express.Router();

const UseController = require("../controllers/UseController");

/**
 * @swagger
 * /api/uml/export:
 *   post:
 *     summary: Export a .use file from JSON UML description
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: uml
 *         description: JSON representation of the UML/model to export. Required.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             model:
 *               type: string
 *             enums:
 *               type: array
 *               items:
 *                 type: object
 *             classes:
 *               type: array
 *               items:
 *                 type: object
 *             associations:
 *               type: array
 *               items:
 *                 type: object
 *             constraints:
 *               type: array
 *               items:
 *                 type: string
 *     responses:
 *       200:
 *         description: A .use file is returned as a plain text attachment
 *         schema:
 *           type: string
 *       400:
 *         description: Invalid request or missing JSON body
 */
router.post("/export", UseController.exportUml);

module.exports = router;
