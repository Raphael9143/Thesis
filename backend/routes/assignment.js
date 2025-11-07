const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

const upload = require('../middlewares/assignmentUpload');
const conditionalUpload = require('../middlewares/conditionalUpload')(upload);
const AssignmentController = require('../controllers/AssignmentController');

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Tạo bài tập mới (chỉ giáo viên)
 *     tags: [Assignment]
 *     security:
 *       - bearerAuth: []
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
 *               - start_date
 *               - end_date
 *             properties:
 *               course_id:
 *                 type: integer
 *                 example: 1
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-20T08:00:00Z"
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-10-01T23:59:00Z"
 *               type:
 *                 type: string
 *                 enum: [SINGLE, GROUP]
 *                 example: SINGLE
 *               title:
 *                 type: string
 *                 example: "Bài tập OCL số 1"
 *               description:
 *                 type: string
 *                 example: "Viết ràng buộc OCL cho mô hình lớp."
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: "Attachment file (e.g. .use, PDF, image)"
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
router.post('/', auth, conditionalUpload, (req, res, next) => {
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
 * /api/assignments/course/{id}:
 *   get:
 *     summary: Lấy tất cả bài tập của một môn học theo course id
 *     tags: [Assignment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Danh sách bài tập của môn học
 */
router.get('/course/:id', auth, AssignmentController.getAssignmentsByCourseId);

/**
 * @swagger
 * /api/assignments/{id}:
 *   put:
 *     summary: Update an assignment by id (teacher who created it or homeroom teacher, or admin)
 *     tags: [Assignment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               type:
 *                 type: string
 *                 enum: [SINGLE, GROUP]
 *               attachment:
 *                 type: string
 *                 format: binary
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               due_date:
 *                 type: string
 *                 format: date-time
 *               week:
 *                 type: integer
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               type:
 *                 type: string
 *                 enum: [SINGLE, GROUP]
 *               attachment:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               due_date:
 *                 type: string
 *                 format: date-time
 *               week:
 *                 type: integer
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
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server Error
 */
router.put('/:id', auth, conditionalUpload, (req, res, next) => {
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
 * /api/assignments/{id}/status:
 *   patch:
 *     summary: Update the status of an assignment by id (teacher who created it or homeroom teacher, or admin)
 *     tags: [Assignment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       200:
 *         description: Assignment status updated
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
 *         description: Assignment not found
 *       500:
 *         description: Internal Server Error
 */
router.patch('/:id/status', auth, AssignmentController.updateAssignmentStatus);

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

/**
 * @swagger
 * /api/assignments/add-to-class:
 *   post:
 *     summary: Thêm assignment đã có trong database vào lớp (qua course)
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
 *               - assignment_id
 *               - course_id
 *             properties:
 *               assignment_id:
 *                 type: integer
 *                 example: 1
 *               course_id:
 *                 type: integer
 *                 example: 1
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-10-01T23:59:00Z"
 *               week:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Assignment đã được thêm vào lớp (qua course)
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
 *       404:
 *         description: Assignment hoặc Course không tồn tại
 *       500:
 *         description: Internal Server Error
 */
router.post('/add-to-class', auth, AssignmentController.addAssignmentToClass);

/**
 * @swagger
 * /api/assignments/{id}:
 *   delete:
 *     summary: Xoá assignment khỏi database (chỉ admin)
 *     tags: [Assignment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Đã xoá assignment khỏi database
 *       403:
 *         description: Chỉ admin mới được xoá assignment
 *       404:
 *         description: Assignment không tồn tại
 *       500:
 *         description: Internal Server Error
 */
router.delete('/:id', auth, AssignmentController.deleteAssignment);

/**
 * @swagger
 * /api/assignments/{id}:
 *   get:
 *     summary: Lấy bài tập theo id
 *     tags: [Assignment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài tập
 *     responses:
 *       200:
 *         description: Thông tin bài tập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       404:
 *         description: Assignment không tồn tại
 *       500:
 *         description: Internal Server Error
 */
router.get('/:id', auth, AssignmentController.getAssignmentById);

module.exports = router;
