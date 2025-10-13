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
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
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

module.exports = router;
