const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const ExamController = require("../controllers/ExamController");
const examUpload = require("../middlewares/examUpload");
const conditionalExamUpload = require("../middlewares/conditionalUpload")(
  examUpload
);

/**
 * @swagger
 * /api/exams:
 *   post:
 *     summary: Tạo bài thi (chỉ giáo viên)
 *     tags: [Exam]
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
 *               - start_date
 *               - end_date
 *             properties:
 *               course_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [SINGLE, GROUP]
 *                 example: SINGLE
 *               model_file:
 *                 type: string
 *     responses:
 *       201:
 *         description: Exam created
 */
router.post("/", auth, conditionalExamUpload, ExamController.createExam);

/**
 * @swagger
 * /api/exams/{id}:
 *   put:
 *     summary: Update an exam by id (teacher who created it or homeroom teacher, or admin)
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Exam ID
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
 *               attachment:
 *                 type: string
 *                 format: binary
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [SINGLE, GROUP]
 *                 example: SINGLE
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [SINGLE, GROUP]
 *                 example: SINGLE
 *     responses:
 *       200:
 *         description: Exam updated
 */
router.put("/:id", auth, conditionalExamUpload, ExamController.updateExam);

/**
 * @swagger
 * /api/exams/{id}:
 *   patch:
 *     summary: Patch an exam by id (partial update)
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Exam ID
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
 *               attachment:
 *                 type: string
 *                 format: binary
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Exam patched
 */
router.patch("/:id", auth, conditionalExamUpload, ExamController.patchExam);

/**
 * @swagger
 * /api/exams/{id}:
 *   delete:
 *     summary: Delete an exam by id (admin only)
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Exam ID
 *     responses:
 *       200:
 *         description: Exam deleted
 */
router.delete("/:id", auth, ExamController.deleteExam);

/**
 * @swagger
 * /api/exams/{id}:
 *   get:
 *     summary: Lấy chi tiết bài thi theo id
 *     tags: [Exam]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Exam details
 */
router.get("/:id", ExamController.getExamById);

/**
 * @swagger
 * /api/exams/course/{id}:
 *   get:
 *     summary: get all assignment by course id
 *     tags: [Exam]
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
 *         description: Danh sách bài thi của môn học
 */
router.get("/course/:id", auth, ExamController.getExamsByCourseId);

module.exports = router;
