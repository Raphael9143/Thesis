const express = require("express");
const router = express.Router();
const GroupController = require("../controllers/GroupController");
const auth = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Group management for group assignments and exams
 */

/**
 * @swagger
 * /api/groups/assignment:
 *   post:
 *     summary: Create assignment group (Student)
 *     tags: [Groups]
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
 *               - group_name
 *             properties:
 *               assignment_id:
 *                 type: integer
 *               group_name:
 *                 type: string
 *               max_members:
 *                 type: integer
 *                 default: 5
 *     responses:
 *       201:
 *         description: Group created successfully with research project
 *       400:
 *         description: Not a group assignment or student already in group
 *       403:
 *         description: Not enrolled in class for this assignment
 */
router.post("/assignment", auth, GroupController.createAssignmentGroup);

/**
 * @swagger
 * /api/groups/exam:
 *   post:
 *     summary: Create exam group (Student)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exam_id
 *               - group_name
 *             properties:
 *               exam_id:
 *                 type: integer
 *               group_name:
 *                 type: string
 *               max_members:
 *                 type: integer
 *                 default: 5
 *     responses:
 *       201:
 *         description: Group created successfully with research project
 */
router.post("/exam", auth, GroupController.createExamGroup);

/**
 * @swagger
 * /api/groups/assignment/{id}/members:
 *   post:
 *     summary: Add member to assignment group (Owner only)
 *     tags: [Groups]
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
 *             required:
 *               - student_id
 *             properties:
 *               student_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Member added successfully
 *       403:
 *         description: Only owner can add members
 */
router.post(
  "/assignment/:id/members",
  auth,
  GroupController.addMemberToAssignmentGroup
);

/**
 * @swagger
 * /api/groups/exam/{id}/members:
 *   post:
 *     summary: Add member to exam group (Owner only)
 *     tags: [Groups]
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
 *             required:
 *               - student_id
 *             properties:
 *               student_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Member added successfully
 */
router.post("/exam/:id/members", auth, GroupController.addMemberToExamGroup);

/**
 * @swagger
 * /api/groups/assignment/{id}/members:
 *   delete:
 *     summary: Remove member from assignment group
 *     tags: [Groups]
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
 *             required:
 *               - student_id
 *             properties:
 *               student_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Member removed successfully
 */
router.delete(
  "/assignment/:id/members",
  auth,
  GroupController.removeMemberFromAssignmentGroup
);

/**
 * @swagger
 * /api/groups/exam/{id}/members:
 *   delete:
 *     summary: Remove member from exam group
 *     tags: [Groups]
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
 *             required:
 *               - student_id
 *             properties:
 *               student_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Member removed successfully
 */
router.delete(
  "/exam/:id/members",
  auth,
  GroupController.removeMemberFromExamGroup
);

/**
 * @swagger
 * /api/groups/assignment/{id}:
 *   get:
 *     summary: Get assignment group details with members
 *     tags: [Groups]
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
 *         description: Group details with members
 */
router.get("/assignment/:id", auth, GroupController.getAssignmentGroup);

/**
 * @swagger
 * /api/groups/exam/{id}:
 *   get:
 *     summary: Get exam group details with members
 *     tags: [Groups]
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
 *         description: Group details with members
 */
router.get("/exam/:id", auth, GroupController.getExamGroup);

/**
 * @swagger
 * /api/groups/assignment/{assignmentId}/list:
 *   get:
 *     summary: List all groups for an assignment (Teachers, Admin)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of all groups with member counts
 */
router.get(
  "/assignment/:assignmentId/list",
  auth,
  GroupController.listAssignmentGroups
);

/**
 * @swagger
 * /api/groups/exam/{examId}/list:
 *   get:
 *     summary: List all groups for an exam (Teachers, Admin)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of all groups with member counts
 */
router.get("/exam/:examId/list", auth, GroupController.listExamGroups);

/**
 * @swagger
 * /api/groups/my/assignment/{assignmentId}:
 *   get:
 *     summary: Get my group for assignment (Student)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Your group details
 *       404:
 *         description: Not in any group for this assignment
 */
router.get(
  "/my/assignment/:assignmentId",
  auth,
  GroupController.getMyAssignmentGroup
);

/**
 * @swagger
 * /api/groups/my/exam/{examId}:
 *   get:
 *     summary: Get my group for exam (Student)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Your group details
 *       404:
 *         description: Not in any group for this exam
 */
router.get("/my/exam/:examId", auth, GroupController.getMyExamGroup);

module.exports = router;
