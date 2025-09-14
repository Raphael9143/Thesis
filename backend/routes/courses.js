const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const CourseController = require('../controllers/CourseController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         course_id:
 *           type: integer
 *         course_name:
 *           type: string
 *         course_code:
 *           type: string
 *         description:
 *           type: string
 *         created_by:
 *           type: integer
 *         semester:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Lấy danh sách tất cả môn học
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách môn học
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *   post:
 *     summary: Tạo môn học mới và ánh xạ với lớp học
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_name
 *               - course_code
 *               - class_id
 *             properties:
 *               course_name:
 *                 type: string
 *               course_code:
 *                 type: string
 *               description:
 *                 type: string
 *               semester:
 *                 type: string
 *               class_id:
 *                 type: integer
 *               start_week:
 *                 type: integer
 *               end_week:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, ARCHIVED]
 *     responses:
 *       201:
 *         description: Môn học đã được tạo và ánh xạ với lớp học
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     class_course:
 *                       type: object
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Class not found
 */
router.get('/', auth, CourseController.getAllCourses);
router.post('/', auth, CourseController.createCourse);

/**
 * @swagger
 * /api/courses/by-class/{classId}:
 *   get:
 *     summary: Lấy danh sách môn học theo lớp
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID lớp học
 *     responses:
 *       200:
 *         description: Danh sách môn học của lớp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *       404:
 *         description: Class not found
 */
router.get('/by-class/:classId', auth, CourseController.getCoursesByClass);

module.exports = router;
