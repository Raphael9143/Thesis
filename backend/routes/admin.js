const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/role');

// All routes require authentication + ADMIN role
router.use(auth);
router.use(requireRole('ADMIN'));

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats returned
 */
router.get('/stats', AdminController.stats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List users (paginated)
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role (STUDENT|TEACHER|ADMIN|RESEARCHER)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default 50)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users with pagination metadata
 */
router.get('/users', AdminController.listUsers);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/users', AdminController.createUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get a user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User returned
 */
router.get('/users/:id', AdminController.getUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/users/:id', AdminController.deleteUser);

module.exports = router;
