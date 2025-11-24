const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const UserController = require("../controllers/UserController");

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.delete("/:id", auth, UserController.deleteUser);

/**
 * @swagger
 * /api/users/students/emails:
 *   get:
 *     summary: Get list of all student emails
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of emails
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
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get("/students/emails", auth, UserController.getStudentEmails);

/**
 * @swagger
 * /api/users/by-email:
 *   get:
 *     summary: Get userId by email
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Email to lookup
 *     responses:
 *       200:
 *         description: User id and email
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
 *                     email:
 *                       type: string
 *       400:
 *         description: Missing email
 *       404:
 *         description: User not found
 */
router.get("/by-email", auth, UserController.getUserIdByEmail);

module.exports = router;
