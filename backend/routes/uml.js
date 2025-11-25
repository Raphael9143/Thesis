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

// Serialize single operation JSON to an operation line or class block
/**
 * @swagger
 * /api/uml/serialize/operation:
 *   post:
 *     summary: Serialize a single operation JSON into a .use operation line or class block
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: operation
 *         description: JSON object describing an operation.
 *           Optionally include `class` to wrap into a class block.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             class:
 *               type: string
 *             op:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 signature:
 *                   type: string
 *                 returnType:
 *                   type: string
 *     responses:
 *       200:
 *         description: Plain text of operation line or class block
 *       400:
 *         description: Invalid request body
 */
router.post("/serialize/operation", UseController.serializeOperation);


/**
 * @swagger
 * /api/uml/deserialize/query-operation:
 *   post:
 *     summary: Deserialize only query operations from a .use class block or operation text
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: payload
 *         description: Provide `text` containing a class block or a single operation line.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *             class:
 *               type: string
 *     responses:
 *       200:
 *         description: Query operations extracted from the class or operation text
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             class:
 *               type: string
 *             query_operations:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   signature:
 *                     type: string
 *                   returnType:
 *                     type: string
 *                   body:
 *                     type: string
 */
// Deserialize only query operations from a class block or operation text
router.post("/serialize/query-operation", UseController.serializeQueryOperation);

// Serialize single enum JSON to a .use enum block
/**
 * @swagger
 * /api/uml/serialize/enum:
 *   post:
 *     summary: Serialize a single enum JSON into a .use enum block
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: enum
 *         description: JSON object describing an enum (name, values)
 *         required: true
 *         schema:
 *           type: object
 *     responses:
 *       200:
 *         description: Plain text of the enum block
 *       400:
 *         description: Invalid request body
 */
router.post("/serialize/enum", UseController.serializeEnum);

// Serialize constraints block
/**
 * @swagger
 * /api/uml/serialize/constraint:
 *   post:
 *     summary: Serialize constraints JSON or raw_text into a .use constraints block
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: constraints
 *         description: JSON object containing `constraints` array or `raw_text`
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             constraints:
 *               type: array
 *               items:
 *                 type: object
 *             raw_text:
 *               type: string
 *     responses:
 *       200:
 *         description: Plain text `constraints` block
 *       400:
 *         description: Invalid request body
 */
router.post("/serialize/constraint", UseController.serializeConstraints);

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

/**
 * @swagger
 * /api/uml/deserialize/operation:
 *   post:
 *     summary: Deserialize a .use operation line or class block into JSON
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: operation
 *         description: .use operation text or class block.
 *           Optionally include `class` to attach a class name for single-line operations.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *             class:
 *               type: string
 *     responses:
 *       200:
 *         description: JSON representation of the operation
 *       400:
 *         description: Invalid request body
 */
router.post("/deserialize/operation", UseController.deserializeOperation);

/**
 * @swagger
 * /api/uml/deserialize/query-operation:
 *   post:
 *     summary: Deserialize only query operations from a .use class block or operation text
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: payload
 *         description: Provide `text` containing a class block or a single operation line.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *             class:
 *               type: string
 *     responses:
 *       200:
 *         description: Query operations extracted from the class or operation text
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             class:
 *               type: string
 *             query_operations:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   signature:
 *                     type: string
 *                   returnType:
 *                     type: string
 *                   body:
 *                     type: string
 */
// Deserialize only query operations from a class block or operation text
router.post("/deserialize/query-operation", UseController.deserializeQueryOperation);

// Deserialize constraints block
/**
 * @swagger
 * /api/uml/deserialize/constraint:
 *   post:
 *     summary: Deserialize a .use constraints block into structured JSON
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: constraints
 *         description: Object with `text` containing the constraints block
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *     responses:
 *       200:
 *         description: JSON array of parsed constraints
 *       400:
 *         description: Invalid request body
 */
router.post("/deserialize/constraint", UseController.deserializeConstraints);

// Deserialize a .use enum block into JSON
/**
 * @swagger
 * /api/uml/deserialize/enum:
 *   post:
 *     summary: Deserialize a .use enum block into JSON
 *     tags:
 *       - UML
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: enum
 *         description: .use enum block text
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *     responses:
 *       200:
 *         description: JSON representation of the enum
 *       400:
 *         description: Invalid request body
 */
router.post("/deserialize/enum", UseController.deserializeEnum);

module.exports = router;
