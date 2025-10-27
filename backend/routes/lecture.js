const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const LectureController = require('../controllers/LectureController');

/**
 * @swagger
 * /api/lectures:
 *   post:
 *     summary: Tạo bài giảng (chỉ giáo viên chủ nhiệm của lớp có môn học đó)
 *     tags: [Lecture]
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
 *               class_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *               publish_date:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       201:
 *         description: Lecture created
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 */
router.post('/', auth, LectureController.createLecture);

/**
 * @swagger
 * /api/lectures/{id}:
 *   get:
 *     summary: Lấy chi tiết bài giảng theo id
 *     tags: [Lecture]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lecture details
 */
router.get('/:id', LectureController.getLectureById);


/**
 * @swagger
 * /api/lectures/class/{id}:
 *   get:
 *     summary: Lấy tất cả bài giảng của một lớp theo class id (admin, giáo viên chủ nhiệm hoặc sinh viên trong lớp)
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Danh sách bài giảng của lớp
 */
router.get('/class/:id', auth, LectureController.getLecturesByClassId);

module.exports = router;
