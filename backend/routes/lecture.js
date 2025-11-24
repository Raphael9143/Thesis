const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const LectureController = require("../controllers/LectureController");
const lectureUpload = require("../middlewares/lectureUpload");
const conditionalLectureUpload = require("../middlewares/conditionalUpload")(
  lectureUpload
);

/**
 * @swagger
 * /api/lectures:
 *   post:
 *     summary: Create a lecture (only the course's homeroom teacher)
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
router.post(
  "/",
  auth,
  conditionalLectureUpload,
  (req, res, next) => {
    // If the client sent attachment as a JSON string field, try to parse it
    if (req.body.attachment && typeof req.body.attachment === "string") {
      // keep as string path; no JSON parsing needed for single attachment
      // normalize empty string to undefined
      if (req.body.attachment === "") delete req.body.attachment;
    }
    next();
  },
  LectureController.createLecture
);

/**
 * @swagger
 * /api/lectures/{id}:
 *   get:
 *     summary: Get lecture details by id
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
router.get("/:id", LectureController.getLectureById);

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
router.delete("/:id", auth, LectureController.deleteLecture);

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
router.patch("/:id/status", auth, LectureController.updateLectureStatus);
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
// Allow single attachment to be updated via multipart form-data under field 'attachment'
router.patch(
  "/:id",
  auth,
  conditionalLectureUpload,
  (req, res, next) => {
    if (req.body.attachment && typeof req.body.attachment === "string") {
      if (req.body.attachment === "") delete req.body.attachment;
    }
    next();
  },
  LectureController.updateLecture
);

/**
 * @swagger
 * /api/lectures/course/{id}:
 *   get:
 *     summary: Get all lectures by course id
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
 *         description: List of lectures for the course
 */
router.get("/course/:id", auth, LectureController.getLecturesByCourseId);

module.exports = router;
