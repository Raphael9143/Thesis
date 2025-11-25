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
 *     summary: Create exam (teacher only)
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
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 example: draft
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
 *           example:
 *             course_id: 10
 *             title: "Midterm Exam"
 *             description: "Midterm covering chapters 1-5"
 *             status: "draft"
 *             start_date: "2025-10-15T09:00:00Z"
 *             end_date: "2025-10-15T11:00:00Z"
 *             type: "SINGLE"
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
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 example: draft
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: "Attachment file (e.g. .use, PDF, image)"
 *               answer:
 *                 type: string
 *                 format: binary
 *                 description: "Optional teacher answer .use file"
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
 *           examples:
 *             update_title_and_file:
 *               summary: Update title and upload new file
 *               value:
 *                 title: "Midterm Exam - Updated"
 *                 status: "published"
 *                 start_date: "2025-10-15T09:00:00Z"
 *                 end_date: "2025-10-15T11:00:00Z"
 *                 type: "SINGLE"
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
 *                 example: draft
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
 *           example:
 *             title: "Midterm Exam - Revised"
 *             description: "Extended coverage up to chapter 6"
 *             status: "published"
 *             start_date: "2025-10-15T09:00:00Z"
 *             end_date: "2025-10-15T11:10:00Z"
 *             type: "SINGLE"
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
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 example: draft
 *               attachment:
 *                 type: string
 *                 format: binary
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *           examples:
 *             patch_status_publish:
 *               summary: Publish exam via multipart
 *               value:
 *                 status: "published"
 *     responses:
 *       200:
 *         description: Exam patched
 */
router.patch("/:id", auth, conditionalExamUpload, ExamController.patchExam);

/**
 * @swagger
 * /api/exams/{id}/status:
 *   patch:
 *     summary: Update exam status (creator, homeroom teacher, or admin)
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 example: published
 *           examples:
 *             publish_exam:
 *               summary: Publish the exam
 *               value:
 *                 status: "published"
 *             archive_exam:
 *               summary: Archive the exam
 *               value:
 *                 status: "archived"
 *     responses:
 *       200:
 *         description: Exam status updated
 */
router.patch(
  "/:id/status",
  auth,
  ExamController.patchExamStatus
);

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
 *     summary: Get exam details by id
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
 *         description: List of exams for the course
 */
router.get("/course/:id", auth, ExamController.getExamsByCourseId);

/**
 * Patch or replace the teacher answer for an exam
 */
router.patch(
  "/:id/answer",
  auth,
  conditionalExamUpload,
  ExamController.patchAnswer
);

module.exports = router;
