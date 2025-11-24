const express = require("express");
const router = express.Router();
const ClassController = require("../controllers/ClassController");
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/role");
/**
 * @swagger
 * /api/class/{id}/student-count:
 *   get:
 *     summary: Get student count for a class
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
*     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
*         description: Class ID
 *     responses:
 *       200:
 *         description: Number of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 classId:
 *                   type: integer
 *                 studentCount:
 *                   type: integer
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id/student-count", auth, ClassController.getStudentCountOfClass);
/**
 * @swagger
 * /api/class/{id}/students:
 *   get:
 *     summary: Get list of students in a class
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
*     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
*         description: Class ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number (20 students per page). Default 1.
 *     responses:
 *       200:
 *         description: Student list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       student_name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *                       classStudentId:
 *                         type: integer
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id/students", auth, ClassController.getStudentsOfClass);

/**
 * @swagger
 * /api/class/{id}:
 *   delete:
 *     summary: Delete class by id
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
*     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
*         description: Class ID
 *     responses:
 *       200:
 *         description: Class deleted
 *       403:
 *         description: Only admin can delete class.
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", auth, requireRole("admin"), ClassController.deleteClass);

/**
 * @swagger
 * /api/class/{id}/students:
 *   delete:
 *     summary: Remove students from class (homeroom teacher or admin)
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
*     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
*         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentIds
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [4, 5, 6]
 *     responses:
 *       200:
 *         description: Student removed from class
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id/students",
  auth,
  requireRole("TEACHER", "ADMIN"),
  ClassController.removeStudentFromClass
);

/**
 * @swagger
 * /api/class/{id}/status:
 *   patch:
 *     summary: Update class status (homeroom teacher or admin)
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
*     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
*         description: Class ID
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
 *                 enum: [draft, active, in_progress, closed, archived, cancelled]
 *                 description: |
 *                   - draft: Class is created but not yet published. 
 *                   - active: Class is published and students can join. 
 *                   - closed: Class has ended; students can no longer submit new work.
 *                   - archived: Old classes are archived for reference but no longer active.
 *                   - cancelled: Class is cancelled before it starts or while it's active.
 *                 example: draft
 *     responses:
 *       200:
 *         description: Class status updated
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id/status",
  auth,
  requireRole("TEACHER", "ADMIN"),
  ClassController.updateClassStatus
);

/**
 * @swagger
 * /api/class/{id}/students:
 *   post:
 *     summary: Add students to class (homeroom teacher or admin)
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
*     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
*         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentEmails
 *             properties:
 *               studentEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["student1@gmail.com", "student2@gmail.com"]
 *     responses:
 *       201:
 *         description: Student added to class
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:id/students",
  auth,
  requireRole("TEACHER", "ADMIN"),
  ClassController.addStudentToClass
);

/**
 * @swagger
 * /api/class/{id}:
 *   put:
 *     summary: Update class information (homeroom teacher or admin)
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
*     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
*         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               # semester (removed)
 *               year:
 *                 type: integer
 *               max_students:
 *                 type: integer
*                 description: "Maximum number of students allowed in the class."
 *               status:
 *                 type: string
 *                 enum: [active, archived]
 *     responses:
 *       200:
 *         description: Class updated
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  auth,
  requireRole("TEACHER", "ADMIN"),
  ClassController.updateClass
);

/**
 * @swagger
 * /api/class:
 *   post:
 *     summary: Create class (teacher only)
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
*     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: "UML-OCL 2025"
 *               code:
 *                 type: string
 *                 example: "UML101"
 *               description:
 *                 type: string
*                 example: "Class about UML and OCL for 3rd year students."
 *               # semester (removed)
 *               year:
 *                 type: integer
 *                 example: 2025
 *               max_students:
 *                 type: integer
 *                 example: 50
 *                 description: "Maximum number of students allowed in the class."
 *               status:
 *                 type: string
 *                 enum: [active, archived]
 *                 example: "active"
 *               studentEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["student1@gmail.com", "student2@gmail.com"]
 *     responses:
 *       201:
 *         description: Class created
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post("/", auth, requireRole("TEACHER"), ClassController.createClass);

/**
 * @swagger
 * /api/class:
 *   get:
 *     summary: Get all classes (admin only)
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
*     responses:
 *       200:
 *         description: List of classes
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
 *                     $ref: '#/components/schemas/Class'
 *       403:
 *         description: Only admin can view all classes
 *       500:
 *         description: Internal Server Error
 */
router.get("/", auth, ClassController.getAllClasses);

/**
 * @swagger
 * /api/class/{id}:
 *   get:
 *     summary: Get class information by id
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
*     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
*         description: Class ID
 *     responses:
 *       200:
*         description: Class information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", auth, ClassController.getClassById);

module.exports = router;
