const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const CourseController = require("../controllers/CourseController");

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get list of all courses
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     description: Returns courses visible to the caller. Students will not receive courses with status `DRAFT`.
 *     responses:
 *       200:
 *         description: List of courses
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
 *                     $ref: '#/components/schemas/Course'
 */
router.get("/", auth, CourseController.getAllCourses);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course and map it to a class
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_name
 *               - course_code
 *               - class_id
 *             properties:
 *               course_name:
 *                 type: string
 *                 example: "Lập trình nâng cao"
 *               course_code:
 *                 type: string
 *                 example: "CS2025"
 *               description:
 *                 type: string
 *                 example: "Course about advanced programming techniques."
 *               semester:
 *                 type: string
 *                 example: "Spring 2025"
 *               class_id:
 *                 type: integer
 *                 example: 1
 *               # start_week/end_week and semester removed from Course schema
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
 *     responses:
 *       201:
 *         description: Course created and mapped to the class
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
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     class_course:
 *                       type: object
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Class not found
 */
router.post("/", auth, CourseController.createCourse);

/**
 * @swagger
 * /api/courses/by-class/{classId}:
 *   get:
 *     summary: Get list of courses for a class
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Class ID
 *     description: Returns courses mapped to the class. Students will not receive courses with status `DRAFT`.
 *     responses:
 *       200:
 *         description: List of courses for the class
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
 *                     $ref: '#/components/schemas/Course'
 *       404:
 *         description: Class not found
 */
router.get("/by-class/:classId", auth, CourseController.getCoursesByClass);

/**
 * @swagger
 * /api/courses/{id}:
 *   patch:
 *     summary: Update class-course mapping information (class_courses)
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của bản ghi class_course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               # start_week and end_week removed from schema
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DRAFT, INACTIVE]
 *                 example: ACTIVE
 *               name:
 *                 type: string
 *                 description: Course name (`course_name`)
 *                 example: "Lập trình nâng cao"
 *               description:
 *                 type: string
 *                 description: Course description
 *                 example: "Course about advanced programming techniques."
 *     responses:
 *       200:
 *         description: Update successful
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
 *                   type: object
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
// PATCH /api/courses/:id
router.patch("/:id", auth, CourseController.updateClassCourse);

/**
 * @swagger
 * /api/courses/{id}/status:
 *   patch:
 *     summary: Update course status
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Course ID
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
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: Status update successful
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
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
// PATCH /api/courses/:id/status - cập nhật trạng thái course
router.patch("/:id/status", auth, CourseController.updateCourseStatus);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của môn học (course)
 *     responses:
 *       200:
 *         description: Course deleted
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
 *         description: Not found
 */
router.delete("/:id", auth, CourseController.deleteCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course information by id
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get("/:id", auth, CourseController.getCourseById);

/**
 * @swagger
 * /api/courses/by-code/{code}:
 *   get:
 *     summary: Get course information by code
 *     tags: [Course]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Course code (`course_code`)
 *     responses:
 *       200:
 *         description: Course information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get("/by-code/:code", auth, CourseController.getCourseByCode);

module.exports = router;
