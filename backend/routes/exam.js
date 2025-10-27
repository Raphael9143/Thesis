const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const ExamController = require('../controllers/ExamController');

/**
 * @swagger
 * /api/exams:
 *   post:
 *     summary: Tạo bài thi (chỉ giáo viên)
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               model_file:
 *                 type: string
 *     responses:
 *       201:
 *         description: Exam created
 */
router.post('/', auth, ExamController.createExam);

/**
 * @swagger
 * /api/exams/{id}:
 *   get:
 *     summary: Lấy chi tiết bài thi theo id
 *     tags: [Exam]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Exam details
 */
router.get('/:id', ExamController.getExamById);

module.exports = router;
