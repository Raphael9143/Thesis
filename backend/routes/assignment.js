const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const AssignmentController = require('../controllers/AssignmentController');

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Tạo bài tập mới (chỉ giáo viên)
 *     tags: [Assignment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_id
 *               - title
 *               - type
 *               - difficulty
 *             properties:
 *               course_id:
 *                 type: integer
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: "Bài tập OCL số 1"
 *               description:
 *                 type: string
 *                 example: "Viết ràng buộc OCL cho mô hình lớp."
 *               type:
 *                 type: string
 *                 enum: [LECTURE, EXERCISE, EXAM]
 *                 example: EXERCISE
 *               constraints:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "OCL"
 *                     rule:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["context Student inv: self.age > 18"]
 *                 example:
 *                   - type: "OCL"
 *                     rule: ["context Student inv: self.age > 18"]
 *                   - type: "UML"
 *                     rule: ["Sơ đồ UML phải có ít nhất 3 lớp"]
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *                 example: MEDIUM
 *     responses:
 *       201:
 *         description: Assignment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/', auth, AssignmentController.createAssignment);

module.exports = router;
