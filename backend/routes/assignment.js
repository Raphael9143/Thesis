const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

const upload = require('../middlewares/assignmentUpload');
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
 *         multipart/form-data:
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
 *                 type: string
 *                 description: JSON.stringify(array) dạng constraints như yêu cầu
 *                 example: '[{"type":"OCL","rule":["context Student inv: self.age > 18"]}]'
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *                 example: MEDIUM
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File OCL/UML/hình ảnh đính kèm
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
router.post('/', auth, upload.single('file'), (req, res, next) => {
	// Nếu có trường constraints là string, parse sang object
	if (req.body.constraints && typeof req.body.constraints === 'string') {
		try {
			req.body.constraints = JSON.parse(req.body.constraints);
		} catch (e) {
			return res.status(400).json({ success: false, message: 'constraints phải là JSON hợp lệ.' });
		}
	}
	next();
}, AssignmentController.createAssignment);

/**
 * @swagger
 * /api/assignments:
 *   get:
 *     summary: Lấy tất cả bài tập
 *     tags: [Assignment]
 *     responses:
 *       200:
 *         description: Danh sách bài tập
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
 *                     $ref: '#/components/schemas/Assignment'
 */
router.get('/', AssignmentController.getAllAssignments);

/**
 * @swagger
 * /api/assignments/class/{classId}:
 *   get:
 *     summary: Lấy tất cả bài tập theo lớp
 *     tags: [Assignment]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của lớp
 *     responses:
 *       200:
 *         description: Danh sách bài tập theo lớp
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
 *                     $ref: '#/components/schemas/Assignment'
 */
router.get('/class/:classId', AssignmentController.getAssignmentsByClass);

/**
 * @swagger
 * /api/assignments/{id}:
 *   put:
 *     summary: Sửa bài tập (chỉ giảng viên đứng lớp chứa bài tập đó)
 *     tags: [Assignment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài tập
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [LECTURE, EXERCISE, EXAM]
 *               constraints:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Assignment updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server Error
 */
router.put('/:id', auth, upload.single('file'), (req, res, next) => {
	if (req.body.constraints && typeof req.body.constraints === 'string') {
		try {
			req.body.constraints = JSON.parse(req.body.constraints);
		} catch (e) {
			return res.status(400).json({ success: false, message: 'constraints phải là JSON hợp lệ.' });
		}
	}
	next();
}, AssignmentController.updateAssignment);

/**
 * @swagger
 * /api/assignments/remove-from-course/{assignmentId}:
 *   patch:
 *     summary: Xoá assignment khỏi course (không xoá khỏi assignments)
 *     tags: [Assignment]
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của assignment
 *     responses:
 *       200:
 *         description: Đã xoá assignment khỏi course
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
 *                   $ref: '#/components/schemas/Assignment'
 *       404:
 *         description: Assignment không tồn tại
 *       500:
 *         description: Internal Server Error
 */
router.patch('/remove-from-course/:assignmentId', auth, AssignmentController.removeAssignmentFromCourse);

module.exports = router;
