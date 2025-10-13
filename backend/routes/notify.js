const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { emitToUser, emitToUserWithAck } = require('../realtime/socket');

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
 *     summary: Gửi thông báo in-app đến một người dùng (WebSocket)
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
 *         description: ID của người dùng nhận thông báo
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
 *         description: Đã gửi thông báo (emit) đến user qua Socket.IO
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 */
router.post('/:userId', auth, (req, res) => {
  const { userId } = req.params;
  const { title = 'Notification', body = '', data = {} } = req.body || {};
  emitToUser(userId, 'notification', { title, body, data, ts: Date.now() });
  res.json({ success: true });
});

/**
 * @swagger
 * /api/notify/{userId}/with-ack:
 *   post:
 *     summary: Gửi thông báo kèm xác nhận nhận từ client
 *     description: Phát sự kiện 'notification' với callback để client phản hồi, trả về kết quả ack hoặc timeout.
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
 *         description: Kết quả gửi thông báo với ack
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
router.post('/:userId/with-ack', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { title = 'Notification', body = '', data = {}, timeoutMs = 5000 } = req.body || {};
    const delivery = await emitToUserWithAck(userId, 'notification', { title, body, data, ts: Date.now() }, timeoutMs);
    res.json({ success: true, delivery });
  } catch (err) {
    console.error('notify with-ack error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
