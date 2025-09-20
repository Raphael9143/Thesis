const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const submissionUpload = require('../middlewares/submissionUpload');
const SubmissionController = require('../controllers/SubmissionController');

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Nộp bài assignment (chỉ sinh viên trong lớp có assignment đó)
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
 *               - assignment_id
 *               - class_id
 *             properties:
 *               assignment_id:
 *                 type: integer
 *                 example: 1
 *               class_id:
 *                 type: integer
 *                 example: 1
 *               ocl_constraints:
 *                 type: string
 *                 example: '{"type":"OCL","rule":["context Student inv: self.age > 18"]}'
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File UML/OCL nộp lên
 *     responses:
 *       201:
 *         description: Submission created
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/', auth, submissionUpload.single('file'), SubmissionController.submitAssignment);

module.exports = router;
