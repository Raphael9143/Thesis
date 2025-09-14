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
 *         description: Thông tin profile sinh viên
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Student'
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
 *         gpa:
 *           type: number
 *           format: float
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Lấy profile sinh viên hiện tại
router.get('/profile', auth, StudentController.getProfile);

router.get('/enrolled-classes', auth, StudentController.getEnrolledClasses);

module.exports = router;
