const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const submissionUpload = require("../middlewares/submissionUpload");
const SubmissionController = require("../controllers/SubmissionController");

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Nộp bài (chỉ sinh viên đã đăng ký lớp của môn học)
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               assignment_id:
 *                 type: integer
 *                 example: 1
 *               exam_id:
 *                 type: integer
 *                 example: 1
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: File upload (.use only)
 *             example:
 *               assignment_id: 1
 *               attachment: file.use
 *             description: |
 *               Provide either assignment_id or exam_id (mutually exclusive).
 *               class_id is not required; eligibility is inferred from student's enrolled classes.
 *               Attachment must be a .use file.
 *               Attempts are limited by assignment.submission_limit or exam.submission_limit.
 *     responses:
 *       201:
 *         description: Submission created
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server Error
 */
const conditionalSubmissionUpload = require("../middlewares/conditionalUpload")(
  submissionUpload
);
router.post(
  "/",
  auth,
  conditionalSubmissionUpload,
  SubmissionController.submitAssignment
);
// Giáo viên chấm điểm submission (cập nhật score và feedback)
/**
 * @swagger
 * /api/submissions/{id}/grade:
 *   patch:
 *     summary: Giáo viên chấm điểm một submission (cập nhật score và feedback)
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *               feedback:
 *                 type: string
 *           example:
 *             score: 8.5
 *             feedback: "Good structure and correct OCL."
 *     responses:
 *       200:
 *         description: Submission graded
 */
router.patch("/:id/grade", auth, SubmissionController.gradeSubmission);

// Lấy thông tin submission theo id
/**
 * @swagger
 * /api/submissions/{id}:
 *   get:
 *     summary: Lấy thông tin submission theo id (ADMIN, TEACHER hoặc chính sinh viên)
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Submission
 */
router.get("/:id", auth, SubmissionController.getSubmissionById);

// Lấy tất cả submissions của một assignment
/**
 * @swagger
 * /api/submissions/assignment/{id}:
 *   get:
 *     summary: Lấy tất cả submissions của một assignment (ADMIN hoặc teacher của course)
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of submissions
 */
router.get(
  "/assignment/:id",
  auth,
  SubmissionController.getSubmissionsByAssignment
);

// Lấy tất cả submissions của một exam
/**
 * @swagger
 * /api/submissions/exam/{id}:
 *   get:
 *     summary: Lấy tất cả submissions của một exam (ADMIN hoặc teacher của course)
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of submissions
 */
router.get("/exam/:id", auth, SubmissionController.getSubmissionsByExam);

// Remaining attempts for exam
/**
 * @swagger
 * /api/submissions/exam/{id}/remaining-attempts:
 *   get:
 *     summary: Lấy số lần nộp còn lại của sinh viên cho exam
 *     tags: [Submission]
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
 *         description: Remaining attempts info
 */
router.get(
  "/exam/:id/remaining-attempts",
  auth,
  SubmissionController.getRemainingAttemptsByExam
);

// Remaining attempts for assignment
/**
 * @swagger
 * /api/submissions/assignment/{id}/remaining-attempts:
 *   get:
 *     summary: Lấy số lần nộp còn lại của sinh viên cho assignment
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Remaining attempts info
 */
router.get(
  "/assignment/:id/remaining-attempts",
  auth,
  SubmissionController.getRemainingAttemptsByAssignment
);

module.exports = router;
