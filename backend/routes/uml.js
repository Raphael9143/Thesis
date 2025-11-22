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

// Serialize single class JSON to a .use class block
/**
 * @swagger
 * /api/uml/serialize/class:
 *   post:
 *     summary: Serialize a single class JSON into a .use class block
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: class
 *         description: JSON object describing a class
 *         required: true
 *         schema:
 *           type: object
 *     responses:
 *       200:
 *         description: Plain text of the class block
 *       400:
 *         description: Invalid request body
 */
router.post("/serialize/class", UseController.serializeClass);

// Serialize single association JSON to a .use association block
/**
 * @swagger
 * /api/uml/serialize/association:
 *   post:
 *     summary: Serialize a single association JSON into a .use association block
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: association
 *         description: JSON object describing an association (name, parts, type)
 *         required: true
 *         schema:
 *           type: object
 *     responses:
 *       200:
 *         description: Plain text of the association block
 *       400:
 *         description: Invalid request body
 */
router.post("/serialize/association", UseController.serializeAssociation);

/**
 * @swagger
 * /api/uml/deserialize/class:
 *   post:
 *     summary: Deserialize a .use class block into JSON
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: class
 *         description: .use class block text
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *     responses:
 *       200:
 *         description: JSON representation of the class
 *       400:
 *         description: Invalid request body
 */
router.post("/deserialize/class", UseController.deserializeClass);

// Deserialize a .use association block into JSON
/**
 * @swagger
 * /api/uml/deserialize/association:
 *   post:
 *     summary: Deserialize a .use association block into JSON
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: association
 *         description: .use association block text
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *     responses:
 *       200:
 *         description: JSON representation of the association
 *       400:
 *         description: Invalid request body
 */
router.post("/deserialize/association", UseController.deserializeAssociation);

module.exports = router;
