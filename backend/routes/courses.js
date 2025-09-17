const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const CourseController = require('../controllers/CourseController');

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
 *
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
 *                 example: "Lập trình nâng cao"
 *               course_code:
 *                 type: string
 *                 example: "CS2025"
 *               description:
 *                 type: string
 *                 example: "Môn học về các kỹ thuật lập trình nâng cao."
 *               semester:
 *                 type: string
 *                 example: "Spring 2025"
 *               class_id:
 *                 type: integer
 *                 example: 1
 *               start_week:
 *                 type: integer
 *                 example: 1
 *               end_week:
 *                 type: integer
 *                 example: 15
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
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

/**
 * @swagger
 * /api/courses:
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
 *                 example: "Lập trình nâng cao"
 *               course_code:
 *                 type: string
 *                 example: "CS2025"
 *               description:
 *                 type: string
 *                 example: "Môn học về các kỹ thuật lập trình nâng cao."
 *               semester:
 *                 type: string
 *                 example: "Spring 2025"
 *               class_id:
 *                 type: integer
 *                 example: 1
 *               start_week:
 *                 type: integer
 *                 example: 1
 *               end_week:
 *                 type: integer
 *                 example: 15
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
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

/**
 * @swagger
 * /api/courses/{id}:
 *   patch:
 *     summary: Cập nhật thông tin lớp môn học (class_courses)
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của bản ghi class_course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start_week:
 *                 type: integer
 *                 example: 1
 *               end_week:
 *                 type: integer
 *                 example: 15
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
 *               name:
 *                 type: string
 *                 description: Tên môn học (course_name)
 *                 example: "Lập trình nâng cao"
 *               description:
 *                 type: string
 *                 description: Mô tả môn học
 *                 example: "Môn học về các kỹ thuật lập trình nâng cao."
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
// PATCH /api/courses/:id
router.patch('/:id', auth, CourseController.updateClassCourse);

/**
 * @swagger
 * /api/courses/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái (status) của môn học
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của môn học (course)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: Cập nhật status thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
// PATCH /api/courses/:id/status - cập nhật trạng thái course
router.patch('/:id/status', auth, CourseController.updateCourseStatus);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Xóa môn học
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của môn học (course)
 *     responses:
 *       200:
 *         description: Course deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete('/:id', auth, CourseController.deleteCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Lấy thông tin môn học theo id
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của môn học (course)
 *     responses:
 *       200:
 *         description: Thông tin môn học
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, CourseController.getCourseById);

/**
 * @swagger
 * /api/courses/by-code/{code}:
 *   get:
 *     summary: Lấy thông tin môn học theo mã code
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Mã code của môn học (course_code)
 *     responses:
 *       200:
 *         description: Thông tin môn học
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get('/by-code/:code', auth, CourseController.getCourseByCode);

module.exports = router;
