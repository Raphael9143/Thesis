const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const LectureController = require('../controllers/LectureController');
const lectureUpload = require('../middlewares/lectureUpload');

/**
 * @swagger
 * /api/lectures:
 *   post:
 *     summary: Tạo bài giảng (chỉ giáo viên chủ nhiệm của lớp có môn học đó)
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *               publish_date:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       201:
 *         description: Lecture created
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 */
// Allow multiple attachments under field name 'attachments'
router.post('/', auth, lectureUpload.array('attachments', 10), (req, res, next) => {
	// If the client sent attachments as a JSON string field, try to parse it
	if (req.body.attachments && typeof req.body.attachments === 'string') {
		try {
			req.body.attachments = JSON.parse(req.body.attachments);
		} catch (e) {
			// ignore, will be overridden by uploaded files if present
		}
	}
	next();
}, LectureController.createLecture);

/**
 * @swagger
 * /api/lectures/{id}:
 *   get:
 *     summary: Lấy chi tiết bài giảng theo id
 *     tags: [Lecture]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lecture details
 */
router.get('/:id', LectureController.getLectureById);

/**
 * @swagger
 * /api/lectures/{id}:
 *   delete:
 *     summary: Delete a lecture by id (only lecture owner teacher or admin)
 *     tags: [Lecture]
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
 *         description: Lecture deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete('/:id', auth, LectureController.deleteLecture);


/**
 * @swagger
 * /api/lectures/{id}/status:
 *   patch:
 *     summary: Update lecture status (only lecture owner teacher or admin)
 *     tags: [Lecture]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       200:
 *         description: Lecture status updated
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/status', auth, LectureController.updateLectureStatus);
/**
 * @swagger
 * /api/lectures/{id}:
 *   patch:
 *     summary: Update a lecture by id (only lecture owner teacher or admin)
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               publish_date:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *               publish_date:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       200:
 *         description: Lecture updated
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 */
// Allow attachments to be updated/added via multipart form-data under field 'attachments'
router.patch('/:id', auth, lectureUpload.array('attachments', 10), (req, res, next) => {
	if (req.body.attachments && typeof req.body.attachments === 'string') {
		try { req.body.attachments = JSON.parse(req.body.attachments); } catch (e) { }
	}
	next();
}, LectureController.updateLecture);


/**
 * @swagger
 * /api/lectures/course/{id}:
 *   get:
 *     summary: Lấy tất cả bài giảng của một môn học theo course id (admin, giáo viên liên quan, hoặc sinh viên trong lớp)
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Danh sách bài giảng của môn học
 */
router.get('/course/:id', auth, LectureController.getLecturesByCourseId);

module.exports = router;
