const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const UserController = require('../controllers/UserController');

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xóa tài khoản người dùng
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
router.delete('/:id', auth, UserController.deleteUser);

/**
 * @swagger
 * /api/users/students/emails:
 *   get:
 *     summary: Lấy danh sách email của tất cả sinh viên
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách email
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
router.get('/students/emails', auth, UserController.getStudentEmails);

module.exports = router;
