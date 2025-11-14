const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const StudentController = require('../controllers/StudentController');


/**
 * @swagger
 * /api/student/enrolled-classes:
 *   get:
 *     summary: Lấy danh sách các lớp mà sinh viên hiện tại đã tham gia
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách các lớp đã enrolled
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
 *                     classes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Class'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student not found
 */

/**
 * @swagger
 * /api/student/profile:
 *   get:
 *     summary: Lấy thông tin profile sinh viên hiện tại
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin profile sinh viên (gồm cả thông tin user)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StudentProfile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       properties:
 *         student_id:
 *           type: integer
 *         student_code:
 *           type: string
 *         major:
 *           type: string
 *           nullable: true
 *         year:
 *           type: integer
 *           nullable: true
 *         completed_assignments:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     StudentProfile:
 *       type: object
 *       description: Thông tin hợp nhất giữa User và Student
 *       properties:
 *         id:
 *           type: integer
 *         full_name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [STUDENT]
 *         avatar_url:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
 *         dob:
 *           type: string
 *           format: date
 *         phone_number:
 *           type: string
 *         address:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BANNED, PENDING_VERIFICATION]
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         student_id:
 *           type: integer
 *         student_code:
 *           type: string
 *         major:
 *           type: string
 *           nullable: true
 *         year:
 *           type: integer
 *           nullable: true
 *         completed_assignments:
 *           type: integer
 *         enrolled_classes:
 *           type: array
 *           items:
 *             type: integer
 */

/**
 * @swagger
 * /api/student/profile:
 *   patch:
 *     summary: Sửa thông tin profile sinh viên hiện tại
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_code:
 *                 type: string
 *               major:
 *                 type: string
 *               year:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Student profile updated
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
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student not found
 */

// Lấy profile sinh viên hiện tại
router.get('/profile', auth, StudentController.getProfile);

// Sửa thông tin profile sinh viên
router.patch('/profile', auth, StudentController.updateProfile);

router.get('/enrolled-classes', auth, StudentController.getEnrolledClasses);

/**
 * @swagger
 * /api/student/assignments:
 *   get:
 *     summary: Get all assignment with submission info for the current student
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách assignments/exams với thông tin nộp bài
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       kind:
 *                         type: string
 *                         enum: [assignment, exam]
 *                       submissions_count:
 *                         type: integer
 *                       attempt_limit:
 *                         type: integer
 *                         nullable: true
 *                       graded:
 *                         type: boolean
 *                       course_id:
 *                         type: integer
 *                       due_date:
 *                         type: string
 *                         format: date-time
 */
router.get('/assignments', auth, StudentController.getAssignmentsWithSubmissions);
// Get assignments/submissions for a specific student by id (admin/teacher or the student themself)
router.get('/:id/assignments', auth, StudentController.getAssignmentsWithSubmissions);

module.exports = router;
