
const express = require('express');
const router = express.Router();
const ClassController = require('../controllers/ClassController');
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

/**
 * @swagger
 * /api/class/{id}/students:
 *   post:
 *     summary: Thêm học sinh vào lớp học (chỉ teacher chủ nhiệm hoặc admin)
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID lớp học
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentEmails
 *             properties:
 *               studentEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["student1@gmail.com", "student2@gmail.com"]
 *     responses:
 *       201:
 *         description: Student added to class
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/students', auth, requireRole('teacher', 'admin'), ClassController.addStudentToClass);

/**
 * @swagger
 * /api/class/{id}:
 *   put:
 *     summary: Sửa thông tin lớp học (chỉ teacher chủ nhiệm hoặc admin)
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID lớp học
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               semester:
 *                 type: string
 *               year:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active, archived]
 *     responses:
 *       200:
 *         description: Class updated
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', auth, requireRole('teacher', 'admin'), ClassController.updateClass);

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
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: "UML-OCL 2025"
 *               code:
 *                 type: string
 *                 example: "UML101"
 *               description:
 *                 type: string
 *                 example: "Lớp học về UML và OCL cho sinh viên năm 3."
 *               semester:
 *                 type: string
 *                 example: "Spring 2025"
 *               year:
 *                 type: integer
 *                 example: 2025
 *               status:
 *                 type: string
 *                 enum: [active, archived]
 *                 example: "active"
 *               studentEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["student1@gmail.com", "student2@gmail.com"]
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
