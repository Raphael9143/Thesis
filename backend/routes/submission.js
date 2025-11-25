const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const submissionUpload = require("../middlewares/submissionUpload");
const SubmissionController = require("../controllers/SubmissionController");

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Submit assignment/exam (only students enrolled in the course)
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
// Teacher grades a submission (update score and feedback)
/**
 * @swagger
 * /api/submissions/{id}/grade:
 *   patch:
 *     summary: Teacher grades a submission (update score and feedback)
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

// Get submission information by id
/**
 * @swagger
 * /api/submissions/{id}:
 *   get:
 *     summary: Get submission by id (ADMIN, TEACHER or the student who submitted)
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
 *                     id:
 *                       type: integer
 *                     student_id:
 *                       type: integer
 *                     assignment_id:
 *                       type: integer
 *                       nullable: true
 *                     exam_id:
 *                       type: integer
 *                       nullable: true
 *                     attachment:
 *                       type: string
 *                     score:
 *                       type: number
 *                       nullable: true
 *                     auto_grader_score:
 *                       type: number
 *                       nullable: true
 *                       description: Score produced by the automatic grader
 *                     auto_grader_output:
 *                       type: string
 *                       nullable: true
 *                       description: Raw output/text produced by the auto-grader
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.get("/:id", auth, SubmissionController.getSubmissionById);

// Get all submissions for an assignment
/**
 * @swagger
 * /api/submissions/assignment/{id}:
 *   get:
 *     summary: Get all submissions for an assignment (ADMIN or course teacher)
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

// Get all submissions for an exam
/**
 * @swagger
 * /api/submissions/exam/{id}:
 *   get:
 *     summary: Get all submissions for an exam (ADMIN or course teacher)
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
 *     summary: Get remaining submission attempts for a student in an exam
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

// Submission history by assignment for a student
/**
 * @swagger
 * /api/submissions/assignment/{id}/history:
 *   get:
 *     summary: Get submission history for a student for an assignment
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
 *       - in: query
 *         name: student_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Required for teacher/admin; ignored for student
 *     responses:
 *       200:
 *         description: List of submissions
 */
router.get(
  "/assignment/:id/history",
  auth,
  SubmissionController.getSubmissionHistoryByAssignment
);

/**
 * @swagger
 * /api/submissions/exam/{id}/history:
 *   get:
 *     summary: Get submission history for a student for an exam
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
 *       - in: query
 *         name: student_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Required for teacher/admin; ignored for student
 *     responses:
 *       200:
 *         description: List of submissions
 */
router.get(
  "/exam/:id/history",
  auth,
  SubmissionController.getSubmissionHistoryByExam
);

/**
 * @swagger
 * /api/submissions/assignment/{id}/latest-score:
 *   get:
 *     summary: Get student's score (latest submission) for an assignment
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
 *       - in: query
 *         name: student_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Required for teacher/admin; student retrieves own score
 *     responses:
 *       200:
 *         description: Latest score info
 */
router.get(
  "/assignment/:id/latest-score",
  auth,
  SubmissionController.getLatestScoreByAssignment
);

/**
 * @swagger
 * /api/submissions/exam/{id}/latest-score:
 *   get:
 *     summary: Get student's score (latest submission) for an exam
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
 *       - in: query
 *         name: student_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Required for teacher/admin; student retrieves own score
 *     responses:
 *       200:
 *         description: Latest score info
 */
router.get(
  "/exam/:id/latest-score",
  auth,
  SubmissionController.getLatestScoreByExam
);

// Remaining attempts for assignment
/**
 * @swagger
 * /api/submissions/assignment/{id}/remaining-attempts:
 *   get:
 *     summary: Get remaining submission attempts for a student in an assignment
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
