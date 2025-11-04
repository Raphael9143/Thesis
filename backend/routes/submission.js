const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const submissionUpload = require('../middlewares/submissionUpload');
const SubmissionController = require('../controllers/SubmissionController');

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Nộp bài (chỉ sinh viên trong lớp)
 *     tags: [Submission]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *             properties:
 *               assignment_id:
 *                 type: integer
 *                 example: 1
 *               exam_id:
 *                 type: integer
 *                 example: 1
 *               class_id:
 *                 type: integer
 *                 example: 1
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: File upload (.use only)
 *             description: |
 *               Provide either assignment_id or exam_id (mutually exclusive). The class_id is required. Attachment must be a .use file.
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
router.post('/', auth, submissionUpload.single('attachment'), SubmissionController.submitAssignment);

module.exports = router;
