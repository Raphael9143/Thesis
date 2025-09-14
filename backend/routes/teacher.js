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
 * /api/teacher/classes:
 *   get:
 *     summary: Lấy danh sách các lớp mà giáo viên quản lý
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lớp mà giáo viên quản lý
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
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       description:
 *                         type: string
 *                       semester:
 *                         type: string
 *                       year:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       max_students:
 *                         type: integer
 *                       current_students:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only teachers can view their managed classes.
 *       500:
 *         description: Server error
 */
router.get('/classes', auth, TeacherController.getManagedClasses);

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

/**
 * @swagger
 * /api/teacher/profile:
 *   patch:
 *     summary: Sửa thông tin profile giảng viên hiện tại
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teacher_code:
 *                 type: string
 *               department:
 *                 type: string
 *               research_papers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Teacher profile updated
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
 *                   $ref: '#/components/schemas/Teacher'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Teacher not found
 */
router.patch('/profile', auth, TeacherController.updateProfile);
module.exports = router;
