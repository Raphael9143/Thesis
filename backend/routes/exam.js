const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const ExamController = require('../controllers/ExamController');
const examUpload = require('../middlewares/examUpload');

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
router.post('/', auth, examUpload.single('attachment'), ExamController.createExam);

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


/**
 * @swagger
 * /api/exams/course/{id}:
 *   get:
 *     summary: Lấy tất cả bài thi của một môn học theo course id (admin, giáo viên liên quan, hoặc sinh viên trong lớp)
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Danh sách bài thi của môn học
 */
router.get('/course/:id', auth, ExamController.getExamsByCourseId);

module.exports = router;
