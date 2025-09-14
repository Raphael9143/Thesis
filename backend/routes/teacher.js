const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const TeacherController = require('../controllers/TeacherController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Teacher:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         full_name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         avatar_url:
 *           type: string
 *         gender:
 *           type: string
 *         dob:
 *           type: string
 *           format: date
 *         phone_number:
 *           type: string
 *         address:
 *           type: string
 *         status:
 *           type: string
 *         teacher_code:
 *           type: string
 *         department:
 *           type: string
 *         expertise:
 *           type: array
 *           items:
 *             type: string
 *         courses_taught:
 *           type: array
 *           items:
 *             type: integer
 *         research_papers:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/teacher/profile:
 *   get:
 *     summary: Lấy thông tin profile giảng viên hiện tại
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin profile giảng viên
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Teacher'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Teacher not found
 */
router.get('/profile', auth, TeacherController.getProfile);

module.exports = router;
