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
router.get('/enrolled-classes', auth, StudentController.getEnrolledClasses);

module.exports = router;
