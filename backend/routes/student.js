const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const StudentController = require('../controllers/StudentController');


/**
 * @swagger
 * /api/student/enrolled-classes:
 *   get:
 *     summary: Get list of classes the current student is enrolled in
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrolled classes
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
 *                     classes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Class'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student not found
 */

/**
 * @swagger
 * /api/student/profile:
 *   get:
 *     summary: Get current student's profile
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student profile information (including user data)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StudentProfile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       properties:
 *         student_id:
 *           type: integer
 *         student_code:
 *           type: string
 *         major:
 *           type: string
 *           nullable: true
 *         year:
 *           type: integer
 *           nullable: true
 *         completed_assignments:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     StudentProfile:
 *       type: object
 *       description: Combined information from User and Student
 *       properties:
 *         id:
 *           type: integer
 *         full_name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [STUDENT]
 *         avatar_url:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
 *         dob:
 *           type: string
 *           format: date
 *         phone_number:
 *           type: string
 *         address:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BANNED, PENDING_VERIFICATION]
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         student_id:
 *           type: integer
 *         student_code:
 *           type: string
 *         major:
 *           type: string
 *           nullable: true
 *         year:
 *           type: integer
 *           nullable: true
 *         completed_assignments:
 *           type: integer
 *         enrolled_classes:
 *           type: array
 *           items:
 *             type: integer
 */

/**
 * @swagger
 * /api/student/profile:
 *   patch:
 *     summary: Update current student's profile
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_code:
 *                 type: string
 *               major:
 *                 type: string
 *               year:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Student profile updated
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
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student not found
 */

// Get current student's profile
router.get('/profile', auth, StudentController.getProfile);

// Update current student's profile
router.patch('/profile', auth, StudentController.updateProfile);

router.get('/enrolled-classes', auth, StudentController.getEnrolledClasses);

/**
 * @swagger
 * /api/student/assignments:
 *   get:
 *     summary: Get all assignment with submission info for the current student
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assignments/exams with submission information
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       kind:
 *                         type: string
 *                         enum: [assignment, exam]
 *                       submissions_count:
 *                         type: integer
 *                       attempt_limit:
 *                         type: integer
 *                         nullable: true
 *                       graded:
 *                         type: boolean
 *                       course_id:
 *                         type: integer
 *                       due_date:
 *                         type: string
 *                         format: date-time
 */
router.get('/assignments', auth, StudentController.getAssignmentsWithSubmissions);
// Get assignments/submissions for a specific student by id (admin/teacher or the student themself)
router.get('/:id/assignments', auth, StudentController.getAssignmentsWithSubmissions);

module.exports = router;
