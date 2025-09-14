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
 *     summary: Tạo môn học mới
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
 *             properties:
 *               course_name:
 *                 type: string
 *               course_code:
 *                 type: string
 *               description:
 *                 type: string
 *               semester:
 *                 type: string
 *     responses:
 *       201:
 *         description: Môn học đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 */
router.get('/', auth, CourseController.getAllCourses);
router.post('/', auth, CourseController.createCourse);

module.exports = router;
