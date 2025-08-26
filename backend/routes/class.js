const express = require('express');
const router = express.Router();
const ClassController = require('../controllers/ClassController');
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

/**
 * @swagger
 * /api/class:
 *   post:
 *     summary: Tạo lớp học (chỉ teacher)
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Lớp Toán 1"
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2, 3, 4]
 *     responses:
 *       201:
 *         description: Class created
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/', auth, requireRole('teacher'), ClassController.createClass);

module.exports = router;
