const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const conditionalUpload = require("../middlewares/conditionalUpload");
const constraintUpload = require("../middlewares/constraintUpload");
const ConstraintController = require("../controllers/ConstraintController");

// Create question (multipart/form-data if file attached)
/**
 * @swagger
 * /api/constraints/questions:
 *   post:
 *     summary: Create a new constraint question for a research project
 *     tags:
 *       - Constraints
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               research_project_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               question_text:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *             required:
 *               - research_project_id
 *               - title
 *               - question_text
 *     responses:
 *       '201':
 *         description: Question created
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 */
router.post(
  "/questions",
  auth,
  conditionalUpload(constraintUpload),
  ConstraintController.createQuestion
);

// List questions for a project
/**
 * @swagger
 * /api/constraints/projects/{projectId}/questions:
 *   get:
 *     summary: List constraint questions for a research project
 *     tags:
 *       - Constraints
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *      - in: query
 *        name: page
 *        required: false
 *        description: Page number (1-based). Page size is fixed to 10.
 *        schema:
 *          type: integer
 *     responses:
 *       '200':
 *         description: A list of questions
 *       '404':
 *         description: Project not found
 */
router.get(
  "/projects/:projectId/questions",
  ConstraintController.listQuestionsForProject
);

// Submit an answer
/**
 * @swagger
 * /api/constraints/questions/{questionId}/answers:
 *   post:
 *     summary: Submit an OCL constraint answer for a question
 *     tags:
 *       - Constraints
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ocl_text:
 *                 type: string
 *               comment_text:
 *                 type: string
 *             required:
 *               - ocl_text
 *     responses:
 *       '201':
 *         description: Answer submitted (pending review)
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 */
router.post(
  "/questions/:questionId/answers",
  auth,
  ConstraintController.submitAnswer
);

// List answers
/**
 * @swagger
 * /api/constraints/questions/{questionId}/answers:
 *   get:
 *     summary: List answers for a constraint question
 *     tags:
 *       - Constraints
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: A list of answers
 *       '404':
 *         description: Question not found
 */
router.get("/questions/:questionId/answers", ConstraintController.listAnswers);

// Count participants for a question
/**
 * @swagger
 * /api/constraints/questions/{questionId}/participants/count:
 *   get:
 *     summary: Count distinct users who submitted answers for a question
 *     tags:
 *       - Constraints
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Participant count
 *       '404':
 *         description: Question not found
 */
router.get(
  "/questions/:questionId/participants/count",
  ConstraintController.countParticipantsForQuestion
);

// Count total answers for a question
/**
 * @swagger
 * /api/constraints/questions/{questionId}/answers/count:
 *   get:
 *     summary: Count total answers submitted for a question
 *     tags:
 *       - Constraints
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Answer count
 *       '404':
 *         description: Question not found
 */
router.get(
  "/questions/:questionId/answers/count",
  ConstraintController.countAnswersForQuestion
);

// Update answer status (approve/reject)
/**
 * @swagger
 * /api/constraints/answers/{answerId}/status:
 *   put:
 *     summary: Update status of an answer (approve or reject)
 *     tags:
 *       - Constraints
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: New status for the answer
 *                 enum:
 *                   - APPROVED
 *                   - REJECTED
 *             required:
 *               - status
 *     responses:
 *       '200':
 *         description: Status updated
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 */
router.put(
  "/answers/:answerId/status",
  auth,
  ConstraintController.updateAnswerStatus
);

module.exports = router;
