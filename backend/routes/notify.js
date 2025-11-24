const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { emitToUser, emitToUserWithAck } = require("../realtime/socket");

/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: In-app notification endpoints
 */

/**
 * @swagger
 * /api/notify/{userId}:
 *   post:
 *     summary: Send an in-app notification to a user (WebSocket)
 *     description: Phát sự kiện 'notification' qua Socket.IO tới user theo room `user:{userId}`.
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the recipient user
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Hello"
 *               body:
 *                 type: string
 *                 example: "This is a test notification"
 *               data:
 *                 type: object
 *                 additionalProperties: true
 *                 example:
 *                   type: "demo"
 *                   assignmentId: 123
 *     responses:
 *       200:
 *         description: Notification emitted to user via Socket.IO
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 */
router.post("/:userId", auth, (req, res) => {
  const { userId } = req.params;
  const { title = "Notification", body = "", data = {} } = req.body || {};
  emitToUser(userId, "notification", { title, body, data, ts: Date.now() });
  res.json({ success: true });
});

/**
 * @swagger
 * /api/notify/{userId}/with-ack:
 *   post:
 *     summary: Notify user with acknowledgment
 *     description: Notify user and wait for ack from client
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               data:
 *                 type: object
 *               timeoutMs:
 *                 type: integer
 *                 example: 5000
 *     responses:
 *       200:
 *         description: Result of sending notification with acknowledgement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 delivery:
 *                   type: object
 *                   properties:
 *                     ok:
 *                       type: boolean
 *                     reason:
 *                       type: string
 *                     id:
 *                       type: string
 *                     acks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           socketId:
 *                             type: string
 *                           ack:
 *                             type: object
 */
router.post("/:userId/with-ack", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      title = "Notification",
      body = "",
      data = {},
      timeoutMs = 5000,
    } = req.body || {};
    const delivery = await emitToUserWithAck(
      userId,
      "notification",
      { title, body, data, ts: Date.now() },
      timeoutMs
    );
    res.json({ success: true, delivery });
  } catch (err) {
    console.error("notify with-ack error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
